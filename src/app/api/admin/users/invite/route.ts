import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  createInvite,
  listInvites,
} from "@/lib/super-admin/identity/users";
import { jsonError, requireAdminApi } from "@/lib/super-admin/http";

export async function GET(req: NextRequest) {
  try {
    await requireAdminApi(req, "users:read");
    const invites = await listInvites();
    return NextResponse.json({ invites });
  } catch (error) {
    return jsonError(error);
  }
}

const schema = z.object({
  email: z.string().email(),
  roleCodes: z.array(z.string()).min(1),
  expiresInHours: z.number().int().positive().max(720).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const user = await requireAdminApi(req, "users:invite");
    const body = schema.parse(await req.json());
    const invite = await createInvite({
      email: body.email,
      roleCodes: body.roleCodes,
      expiresInHours: body.expiresInHours,
      actorUserId: user.id,
    });
    // Token returned once to the inviter — never stored in plaintext.
    return NextResponse.json(
      {
        inviteId: invite.inviteId,
        expiresAt: invite.expiresAt,
        acceptPath: `/pt-br/super-admin/login?invite=${invite.token}`,
        token: invite.token,
      },
      { status: 201 }
    );
  } catch (error) {
    return jsonError(error);
  }
}
