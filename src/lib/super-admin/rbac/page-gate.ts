import { redirect } from "next/navigation";
import { getAdminSessionFromCookies } from "@/lib/super-admin/auth/session";
import type { AdminSessionUser } from "@/lib/super-admin/auth/session";
import {
  AuthenticationError,
  AuthorizationError,
  requirePermission,
} from "@/lib/super-admin/rbac/authorize";

const SA_BASE = "/pt-br/super-admin";

/**
 * Server-side permission gate for Super Admin RSC pages.
 * Mirrors API `requireAdminApi` permissions; redirects on failure.
 */
export async function requireAdminPage(
  permission: string
): Promise<AdminSessionUser> {
  const session = await getAdminSessionFromCookies();
  try {
    return requirePermission(session, permission);
  } catch (error) {
    if (error instanceof AuthenticationError) {
      redirect(`${SA_BASE}/login`);
    }
    if (error instanceof AuthorizationError) {
      redirect(`${SA_BASE}/settings`);
    }
    redirect(`${SA_BASE}/login`);
  }
}
