import type { AdminSessionUser } from "@/lib/super-admin/auth/session";

export class AuthorizationError extends Error {
  status = 403;
  constructor(message = "Acesso negado") {
    super(message);
    this.name = "AuthorizationError";
  }
}

export class AuthenticationError extends Error {
  status = 401;
  constructor(message = "Não autenticado") {
    super(message);
    this.name = "AuthenticationError";
  }
}

export function hasPermission(
  user: AdminSessionUser | null | undefined,
  permission: string
): boolean {
  if (!user) return false;
  if (user.roles.includes("SUPER_ADMIN")) return true;
  return user.permissions.includes(permission);
}

export function requireAuth(user: AdminSessionUser | null | undefined): AdminSessionUser {
  if (!user) throw new AuthenticationError();
  if (user.status !== "active") throw new AuthenticationError("Conta desativada");
  const isSuper = user.roles.includes("SUPER_ADMIN");
  if (isSuper && user.mfaEnabled && !user.mfaVerified) {
    throw new AuthenticationError("MFA pendente");
  }
  if (isSuper && !user.mfaEnabled) {
    // allow limited access only for MFA enrollment endpoints — callers gate this
  }
  return user;
}

export function requirePermission(
  user: AdminSessionUser | null | undefined,
  permission: string
): AdminSessionUser {
  const authed = requireAuth(user);
  if (!hasPermission(authed, permission)) {
    throw new AuthorizationError();
  }
  return authed;
}

/** SALES can only mutate resources they own unless ADMIN/SUPER_ADMIN. */
export function canAccessOwnedResource(
  user: AdminSessionUser,
  ownerId: string | null | undefined
): boolean {
  if (user.roles.includes("SUPER_ADMIN") || user.roles.includes("ADMIN")) {
    return true;
  }
  if (!ownerId) return true;
  return ownerId === user.id;
}
