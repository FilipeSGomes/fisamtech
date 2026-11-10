import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  assignUserRoles,
  listAdminUsers,
  setUserStatus,
} from "@/lib/super-admin/identity/users";
import { jsonError, requireAdminApi } from "@/lib/super-admin/http";

export async function GET(req: NextRequest) {
  try {
    await requireAdminApi(req, "users:read");
    const sp = req.nextUrl.searchParams;
    const data = await listAdminUsers({
      q: sp.get("q") || undefined,
      page: Number(sp.get("page") || 1),
      pageSize: Number(sp.get("pageSize") || 20),
    });
    return NextResponse.json(data);
  } catch (error) {
    return jsonError(error);
  }
}

const patchSchema = z.object({
  userId: z.string().uuid(),
  status: z.enum(["active", "disabled"]).optional(),
  roleCodes: z.array(z.string()).optional(),
});

export async function PATCH(req: NextRequest) {
  try {
    const user = await requireAdminApi(req, "users:update");
    const body = patchSchema.parse(await req.json());
    if (body.status) {
      await requireAdminApi(req, "users:disable");
      await setUserStatus({
        userId: body.userId,
        status: body.status,
        actorUserId: user.id,
      });
    }
    if (body.roleCodes) {
      await assignUserRoles({
        userId: body.userId,
        roleCodes: body.roleCodes,
        actorUserId: user.id,
      });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
