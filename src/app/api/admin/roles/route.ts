import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  listRolesWithPermissions,
  setRolePermissions,
} from "@/lib/super-admin/identity/roles";
import { jsonError, requireAdminApi } from "@/lib/super-admin/http";

export async function GET(req: NextRequest) {
  try {
    await requireAdminApi(req, "users:read");
    const data = await listRolesWithPermissions();
    return NextResponse.json(data);
  } catch (error) {
    return jsonError(error);
  }
}

const patchSchema = z.object({
  roleCode: z.string().min(2),
  permissionCodes: z.array(z.string()),
});

export async function PATCH(req: NextRequest) {
  try {
    const user = await requireAdminApi(req, "roles:manage");
    const body = patchSchema.parse(await req.json());
    await setRolePermissions({
      roleCode: body.roleCode,
      permissionCodes: body.permissionCodes,
      actorUserId: user.id,
    });
    const data = await listRolesWithPermissions();
    return NextResponse.json(data);
  } catch (error) {
    return jsonError(error);
  }
}
