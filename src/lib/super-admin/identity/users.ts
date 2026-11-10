import { createHash, randomBytes } from "node:crypto";
import { adminQuery } from "@/lib/db";
import { writeAudit } from "@/lib/super-admin/audit/write";
import {
  hashPassword,
  normalizeEmail,
} from "@/lib/super-admin/auth/password";
import { revokeAllUserSessions } from "@/lib/super-admin/auth/session";

export type AdminUserRow = {
  id: string;
  created_at: Date;
  updated_at: Date;
  email: string;
  name: string;
  status: string;
  mfa_enabled: boolean;
  last_login_at: Date | null;
  roles: string[];
};

export async function listAdminUsers(opts: {
  q?: string;
  page?: number;
  pageSize?: number;
}): Promise<{ items: AdminUserRow[]; total: number; page: number; pageSize: number }> {
  const page = Math.max(1, opts.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, opts.pageSize ?? 20));
  const values: unknown[] = [];
  let whereSql = "";
  if (opts.q) {
    values.push(`%${opts.q}%`);
    whereSql = `where (u.name ilike $1 or u.email ilike $1)`;
  }
  const totalResult = await adminQuery<{ n: number }>(
    `select count(*)::int as n from admin_users u ${whereSql}`,
    values
  );
  const total = totalResult.rows[0]?.n ?? 0;
  const offset = (page - 1) * pageSize;
  values.push(pageSize, offset);
  const users = await adminQuery<Omit<AdminUserRow, "roles">>(
    `select u.id, u.created_at, u.updated_at, u.email, u.name, u.status,
            u.mfa_enabled, u.last_login_at
     from admin_users u
     ${whereSql}
     order by u.created_at desc
     limit $${values.length - 1} offset $${values.length}`,
    values
  );

  const items: AdminUserRow[] = [];
  for (const user of users.rows) {
    const roles = await adminQuery<{ code: string }>(
      `select r.code from admin_user_roles ur
       join admin_roles r on r.id = ur.role_id
       where ur.user_id = $1`,
      [user.id]
    );
    items.push({ ...user, roles: roles.rows.map((r) => r.code) });
  }
  return { items, total, page, pageSize };
}

export async function setUserStatus(opts: {
  userId: string;
  status: "active" | "disabled";
  actorUserId: string;
}): Promise<void> {
  if (opts.userId === opts.actorUserId && opts.status === "disabled") {
    throw new Error("Não é possível desativar a si mesmo");
  }
  await adminQuery(
    `update admin_users set status = $2, updated_at = now() where id = $1`,
    [opts.userId, opts.status]
  );
  if (opts.status === "disabled") {
    await revokeAllUserSessions(opts.userId);
  }
  await writeAudit({
    action: opts.status === "disabled" ? "USER_DISABLED" : "USER_ENABLED",
    actorUserId: opts.actorUserId,
    resourceType: "admin_user",
    resourceId: opts.userId,
  });
}

export async function assignUserRoles(opts: {
  userId: string;
  roleCodes: string[];
  actorUserId: string;
}): Promise<void> {
  await adminQuery(`delete from admin_user_roles where user_id = $1`, [
    opts.userId,
  ]);
  for (const code of opts.roleCodes) {
    await adminQuery(
      `insert into admin_user_roles (user_id, role_id, assigned_by)
       select $1, id, $2 from admin_roles where code = $3`,
      [opts.userId, opts.actorUserId, code]
    );
  }
  await writeAudit({
    action: "USER_ROLES_UPDATED",
    actorUserId: opts.actorUserId,
    resourceType: "admin_user",
    resourceId: opts.userId,
    context: { roles: opts.roleCodes },
  });
}

export async function revokeUserSessions(opts: {
  userId: string;
  actorUserId: string;
}): Promise<number> {
  const n = await revokeAllUserSessions(opts.userId);
  await writeAudit({
    action: "USER_SESSIONS_REVOKED",
    actorUserId: opts.actorUserId,
    resourceType: "admin_user",
    resourceId: opts.userId,
    context: { count: n },
  });
  return n;
}

function hashInviteToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function createInvite(opts: {
  email: string;
  roleCodes: string[];
  actorUserId: string;
  expiresInHours?: number;
}): Promise<{ inviteId: string; token: string; expiresAt: Date }> {
  const emailNormalized = normalizeEmail(opts.email);
  const existing = await adminQuery<{ id: string }>(
    `select id from admin_users where email_normalized = $1`,
    [emailNormalized]
  );
  if (existing.rows[0]) throw new Error("Usuário já existe com este e-mail");

  const token = randomBytes(32).toString("base64url");
  const tokenHash = hashInviteToken(token);
  const expiresAt = new Date(
    Date.now() + (opts.expiresInHours ?? 72) * 60 * 60 * 1000
  );

  // revoke previous open invites for same email
  await adminQuery(
    `update admin_invites set revoked_at = now()
     where email_normalized = $1 and accepted_at is null and revoked_at is null`,
    [emailNormalized]
  );

  const inserted = await adminQuery<{ id: string }>(
    `insert into admin_invites (email_normalized, role_codes, token_hash, invited_by, expires_at)
     values ($1,$2,$3,$4,$5) returning id`,
    [emailNormalized, opts.roleCodes, tokenHash, opts.actorUserId, expiresAt]
  );

  await writeAudit({
    action: "USER_INVITED",
    actorUserId: opts.actorUserId,
    resourceType: "admin_invite",
    resourceId: inserted.rows[0].id,
    context: { email: emailNormalized, roles: opts.roleCodes },
  });

  return { inviteId: inserted.rows[0].id, token, expiresAt };
}

export async function acceptInvite(opts: {
  token: string;
  name: string;
  password: string;
}): Promise<string> {
  if (opts.password.length < 12) {
    throw new Error("Senha deve ter ao menos 12 caracteres");
  }
  const tokenHash = hashInviteToken(opts.token);
  const invite = await adminQuery<{
    id: string;
    email_normalized: string;
    role_codes: string[];
    expires_at: Date;
    accepted_at: Date | null;
    revoked_at: Date | null;
  }>(
    `select id, email_normalized, role_codes, expires_at, accepted_at, revoked_at
     from admin_invites where token_hash = $1`,
    [tokenHash]
  );
  const row = invite.rows[0];
  if (!row) throw new Error("Convite inválido");
  if (row.accepted_at) throw new Error("Convite já utilizado");
  if (row.revoked_at) throw new Error("Convite revogado");
  if (new Date(row.expires_at).getTime() < Date.now()) {
    throw new Error("Convite expirado");
  }

  const passwordHash = hashPassword(opts.password);
  const created = await adminQuery<{ id: string }>(
    `insert into admin_users (email, email_normalized, name, password_hash, status)
     values ($1,$1,$2,$3,'active') returning id`,
    [row.email_normalized, opts.name.trim(), passwordHash]
  );
  const userId = created.rows[0].id;
  for (const code of row.role_codes || []) {
    await adminQuery(
      `insert into admin_user_roles (user_id, role_id)
       select $1, id from admin_roles where code = $2`,
      [userId, code]
    );
  }
  await adminQuery(
    `update admin_invites set accepted_at = now() where id = $1`,
    [row.id]
  );
  await writeAudit({
    action: "USER_INVITE_ACCEPTED",
    actorUserId: userId,
    resourceType: "admin_user",
    resourceId: userId,
    context: { inviteId: row.id },
  });
  return userId;
}

export async function listInvites() {
  const result = await adminQuery<{
    id: string;
    email_normalized: string;
    role_codes: string[];
    created_at: Date;
    expires_at: Date;
    accepted_at: Date | null;
    revoked_at: Date | null;
  }>(
    `select id, email_normalized, role_codes, created_at, expires_at, accepted_at, revoked_at
     from admin_invites
     order by created_at desc
     limit 100`
  );
  return result.rows;
}
