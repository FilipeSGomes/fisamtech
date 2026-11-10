import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  getProposal,
  sendProposalEmail,
} from "@/lib/super-admin/proposals/service";
import { jsonError, requireAdminApi } from "@/lib/super-admin/http";
import { canAccessOwnedResource } from "@/lib/super-admin/rbac/authorize";

type Ctx = { params: Promise<{ id: string }> };

const schema = z.object({
  toEmail: z.string().email().optional(),
});

export async function POST(req: NextRequest, ctx: Ctx) {
  try {
    const user = await requireAdminApi(req, "proposals:send");
    const { id } = await ctx.params;
    const proposal = await getProposal(id);
    if (!proposal) {
      return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
    }
    if (!canAccessOwnedResource(user, proposal.owner_id)) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }
    const body = schema.parse(await req.json().catch(() => ({})));
    const result = await sendProposalEmail({
      id,
      toEmail: body.toEmail,
      actorUserId: user.id,
      permissions: user.permissions,
      roles: user.roles,
    });
    const statusCode =
      result.status === "sent"
        ? 200
        : result.status === "pending_config"
          ? 202
          : 502;
    return NextResponse.json(result, { status: statusCode });
  } catch (error) {
    return jsonError(error);
  }
}
