import { adminQuery } from "@/lib/db";
import { writeAudit } from "@/lib/super-admin/audit/write";
import { decryptMfaSecret, verifyTotp } from "./mfa";
import { hashPassword, normalizeEmail, verifyPassword } from "./password";
import {
  createAdminSession,
  markSessionMfaVerified,
  revokeAllUserSessions,
} from "./session";

const MAX_FAILURES = 8;
const LOCK_MINUTES = 15;

export async function authenticateAdmin(opts: {
  email: string;
  password: string;
  totp?: string;
  ip?: string | null;
  userAgent?: string | null;
}): Promise<
  | { ok: true; token: string; expiresAt: Date; requiresMfaSetup: boolean; userId: string }
  | { ok: false; error: string; requiresTotp?: boolean }
> {
  const emailNormalized = normalizeEmail(opts.email);
  const users = await adminQuery<{
    id: string;
    password_hash: string;
    status: string;
    mfa_enabled: boolean;
    mfa_secret: string | null;
    failed_login_count: number;
    locked_until: Date | null;
  }>(
    `select id, password_hash, status, mfa_enabled, mfa_secret,
            failed_login_count, locked_until
     from admin_users where email_normalized = $1 limit 1`,
    [emailNormalized]
  );
  const user = users.rows[0];

  if (!user) {
    await writeAudit({
      action: "LOGIN_FAILURE",
      result: "failure",
      context: { email: emailNormalized },
      ip: opts.ip,
      userAgent: opts.userAgent,
    });
    return { ok: false, error: "Credenciais inválidas" };
  }

  if (user.locked_until && new Date(user.locked_until).getTime() > Date.now()) {
    return { ok: false, error: "Conta temporariamente bloqueada. Tente novamente mais tarde." };
  }

  if (user.status !== "active") {
    await writeAudit({
      action: "LOGIN_FAILURE",
      actorUserId: user.id,
      result: "failure",
      context: { reason: "disabled" },
      ip: opts.ip,
      userAgent: opts.userAgent,
    });
    return { ok: false, error: "Conta desativada" };
  }

  const passwordOk = verifyPassword(opts.password, user.password_hash);
  if (!passwordOk) {
    const failures = user.failed_login_count + 1;
    const lockedUntil =
      failures >= MAX_FAILURES
        ? new Date(Date.now() + LOCK_MINUTES * 60 * 1000).toISOString()
        : null;
    await adminQuery(
      `update admin_users
       set failed_login_count = $2, locked_until = $3, updated_at = now()
       where id = $1`,
      [user.id, failures, lockedUntil]
    );
    await writeAudit({
      action: "LOGIN_FAILURE",
      actorUserId: user.id,
      result: "failure",
      context: { reason: "bad_password" },
      ip: opts.ip,
      userAgent: opts.userAgent,
    });
    return { ok: false, error: "Credenciais inválidas" };
  }

  const roles = await adminQuery<{ code: string }>(
    `select r.code from admin_user_roles ur
     join admin_roles r on r.id = ur.role_id where ur.user_id = $1`,
    [user.id]
  );
  const isSuperAdmin = roles.rows.some((r) => r.code === "SUPER_ADMIN");
  const requiresMfaSetup = isSuperAdmin && !user.mfa_enabled;

  if (user.mfa_enabled) {
    if (!opts.totp) {
      return { ok: false, error: "Informe o código MFA", requiresTotp: true };
    }
    if (!user.mfa_secret) {
      return { ok: false, error: "MFA mal configurado. Contate outro Super Admin." };
    }
    const secret = decryptMfaSecret(user.mfa_secret);
    if (!verifyTotp(secret, opts.totp)) {
      await writeAudit({
        action: "LOGIN_FAILURE",
        actorUserId: user.id,
        result: "failure",
        context: { reason: "bad_totp" },
        ip: opts.ip,
        userAgent: opts.userAgent,
      });
      return { ok: false, error: "Código MFA inválido", requiresTotp: true };
    }
  }

  await adminQuery(
    `update admin_users
     set failed_login_count = 0, locked_until = null, last_login_at = now(), updated_at = now()
     where id = $1`,
    [user.id]
  );

  const session = await createAdminSession({
    userId: user.id,
    ip: opts.ip,
    userAgent: opts.userAgent,
    mfaVerified: user.mfa_enabled,
  });

  await writeAudit({
    action: "LOGIN_SUCCESS",
    actorUserId: user.id,
    result: "success",
    ip: opts.ip,
    userAgent: opts.userAgent,
  });

  return {
    ok: true,
    token: session.token,
    expiresAt: session.expiresAt,
    requiresMfaSetup,
    userId: user.id,
  };
}

export async function completeMfaEnrollment(opts: {
  userId: string;
  sessionToken: string;
  secretBase32: string;
  totp: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!verifyTotp(opts.secretBase32, opts.totp)) {
    return { ok: false, error: "Código MFA inválido" };
  }
  const { encryptMfaSecret } = await import("./mfa");
  await adminQuery(
    `update admin_users
     set mfa_secret = $2, mfa_enabled = true, mfa_enrolled_at = now(), updated_at = now()
     where id = $1`,
    [opts.userId, encryptMfaSecret(opts.secretBase32)]
  );
  await markSessionMfaVerified(opts.sessionToken);
  await writeAudit({
    action: "SETTINGS_CHANGED",
    actorUserId: opts.userId,
    resourceType: "admin_user",
    resourceId: opts.userId,
    context: { mfa_enabled: true },
  });
  return { ok: true };
}

export async function bootstrapSuperAdmin(opts: {
  email: string;
  name: string;
  password: string;
}): Promise<{ id: string }> {
  if (opts.password.length < 12) {
    throw new Error("Password must be at least 12 characters");
  }
  const count = await adminQuery<{ n: number }>(
    `select count(*)::int as n from admin_users`
  );
  if (count.rows[0].n > 0) {
    throw new Error("Bootstrap denied: admin users already exist");
  }
  const emailNormalized = normalizeEmail(opts.email);
  const passwordHash = hashPassword(opts.password);
  const inserted = await adminQuery<{ id: string }>(
    `insert into admin_users (email, email_normalized, name, password_hash, status)
     values ($1, $2, $3, $4, 'active')
     returning id`,
    [opts.email.trim(), emailNormalized, opts.name.trim(), passwordHash]
  );
  const userId = inserted.rows[0].id;
  await adminQuery(
    `insert into admin_user_roles (user_id, role_id)
     select $1, id from admin_roles where code = 'SUPER_ADMIN'`,
    [userId]
  );
  await writeAudit({
    action: "USER_INVITED",
    actorUserId: userId,
    resourceType: "admin_user",
    resourceId: userId,
    context: { bootstrap: true, email: emailNormalized },
  });
  return { id: userId };
}

export { revokeAllUserSessions };
