import { NextRequest, NextResponse } from "next/server";
import { revokeUserSessions } from "@/lib/super-admin/identity/users";
import { jsonError, requireAdminApi } from "@/lib/super-admin/http";

type Ctx = { params: Promise<{ id: string }> };

export async function DELETE(req: NextRequest, ctx: Ctx) {
  try {
    const user = await requireAdminApi(req, "users:update");
    const { id } = await ctx.params;
    const count = await revokeUserSessions({
      userId: id,
      actorUserId: user.id,
    });
    return NextResponse.json({ revoked: count });
  } catch (error) {
    return jsonError(error);
  }
}
