import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest, jsonError } from "@/lib/super-admin/http";
import { AuthenticationError } from "@/lib/super-admin/rbac/authorize";

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) throw new AuthenticationError();
    return NextResponse.json({
      id: session.id,
      email: session.email,
      name: session.name,
      roles: session.roles,
      permissions: session.permissions,
      mfaEnabled: session.mfaEnabled,
      mfaVerified: session.mfaVerified,
      requiresMfaSetup:
        session.roles.includes("SUPER_ADMIN") && !session.mfaEnabled,
    });
  } catch (error) {
    return jsonError(error);
  }
}
