import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { adminQuery } from "@/lib/db";
import { normalizeEmail } from "./password";

export const ADMIN_SESSION_COOKIE = "fisam_admin_session";
const SESSION_TTL_HOURS = 12;

export type AdminSessionUser = {
  id: string;
  email: string;
  name: string;
  status: string;
  mfaEnabled: boolean;
  roles: string[];
  permissions: string[];
  sessionId: string;
  mfaVerified: boolean;
};

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function createSessionToken(): { token: string; tokenHash: string } {
  const token = randomBytes(32).toString("base64url");
  return { token, tokenHash: hashToken(token) };
}

export async function createAdminSession(opts: {
  userId: string;
  ip?: string | null;
  userAgent?: string | null;
  mfaVerified?: boolean;
}): Promise<{ token: string; expiresAt: Date }> {
  const { token, tokenHash } = createSessionToken();
  const expiresAt = new Date(Date.now() + SESSION_TTL_HOURS * 60 * 60 * 1000);
  await adminQuery(
    `insert into admin_sessions (user_id, token_hash, expires_at, ip, user_agent, mfa_verified_at)
     values ($1, $2, $3, $4, $5, $6)`,
    [
      opts.userId,
      tokenHash,
      expiresAt.toISOString(),
      opts.ip ?? null,
      opts.userAgent ?? null,
      opts.mfaVerified ? new Date().toISOString() : null,
    ]
  );
  return { token, expiresAt };
}

export async function revokeAdminSession(token: string): Promise<void> {
  await adminQuery(
    `update admin_sessions set revoked_at = now()
     where token_hash = $1 and revoked_at is null`,
    [hashToken(token)]
  );
}

export async function revokeAllUserSessions(userId: string): Promise<number> {
  const result = await adminQuery(
    `update admin_sessions set revoked_at = now()
     where user_id = $1 and revoked_at is null`,
    [userId]
  );
  return result.rowCount ?? 0;
}

export async function markSessionMfaVerified(token: string): Promise<void> {
  await adminQuery(
    `update admin_sessions set mfa_verified_at = now()
     where token_hash = $1 and revoked_at is null`,
    [hashToken(token)]
  );
}

export async function resolveAdminSession(
  token: string | undefined | null
): Promise<AdminSessionUser | null> {
  if (!token) return null;
  const tokenHash = hashToken(token);
  const session = await adminQuery<{
    session_id: string;
    user_id: string;
    email: string;
    name: string;
    status: string;
    mfa_enabled: boolean;
    mfa_verified_at: Date | null;
    expires_at: Date;
    revoked_at: Date | null;
  }>(
    `select s.id as session_id, s.expires_at, s.revoked_at, s.mfa_verified_at,
            u.id as user_id, u.email, u.name, u.status, u.mfa_enabled
     from admin_sessions s
     join admin_users u on u.id = s.user_id
     where s.token_hash = $1
     limit 1`,
    [tokenHash]
  );
  const row = session.rows[0];
  if (!row) return null;
  if (row.revoked_at) return null;
  if (row.status !== "active") return null;
  if (new Date(row.expires_at).getTime() < Date.now()) return null;

  const rolesResult = await adminQuery<{ code: string }>(
    `select r.code
     from admin_user_roles ur
     join admin_roles r on r.id = ur.role_id
     where ur.user_id = $1`,
    [row.user_id]
  );
  const roles = rolesResult.rows.map((r) => r.code);

  const permsResult = await adminQuery<{ code: string }>(
    `select distinct p.code
     from admin_user_roles ur
     join admin_role_permissions rp on rp.role_id = ur.role_id
     join admin_permissions p on p.id = rp.permission_id
     where ur.user_id = $1`,
    [row.user_id]
  );
  const permissions = permsResult.rows.map((p) => p.code);

  return {
    id: row.user_id,
    email: row.email,
    name: row.name,
    status: row.status,
    mfaEnabled: row.mfa_enabled,
    roles,
    permissions,
    sessionId: row.session_id,
    mfaVerified: Boolean(row.mfa_verified_at),
  };
}

export async function getAdminSessionFromCookies(): Promise<AdminSessionUser | null> {
  const jar = await cookies();
  const token = jar.get(ADMIN_SESSION_COOKIE)?.value;
  return resolveAdminSession(token);
}

export function sessionCookieOptions(expiresAt: Date) {
  return {
    httpOnly: true as const,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    expires: expiresAt,
  };
}

export { normalizeEmail, hashToken };
