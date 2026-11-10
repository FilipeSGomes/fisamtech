import { NextRequest, NextResponse } from "next/server";
import {
  AuthenticationError,
  AuthorizationError,
} from "@/lib/super-admin/rbac/authorize";
import {
  ADMIN_SESSION_COOKIE,
  resolveAdminSession,
  type AdminSessionUser,
} from "@/lib/super-admin/auth/session";
import { requirePermission } from "@/lib/super-admin/rbac/authorize";
import { writeAudit } from "@/lib/super-admin/audit/write";

export async function getSessionFromRequest(
  req: NextRequest
): Promise<AdminSessionUser | null> {
  const token = req.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  return resolveAdminSession(token);
}

export function clientMeta(req: NextRequest) {
  return {
    ip:
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      null,
    userAgent: req.headers.get("user-agent"),
  };
}

export async function requireAdminApi(
  req: NextRequest,
  permission: string
): Promise<AdminSessionUser> {
  const session = await getSessionFromRequest(req);
  try {
    return requirePermission(session, permission);
  } catch (error) {
    if (error instanceof AuthorizationError && session) {
      await writeAudit({
        action: "ACCESS_DENIED",
        actorUserId: session.id,
        result: "denied",
        context: { permission },
        ...clientMeta(req),
      });
    }
    throw error;
  }
}

export function jsonError(error: unknown) {
  if (error instanceof AuthenticationError) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }
  if (error instanceof AuthorizationError) {
    return NextResponse.json({ error: error.message }, { status: 403 });
  }
  if (error instanceof Error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
}
