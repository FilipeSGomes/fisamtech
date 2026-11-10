import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getProposal, transitionProposal } from "@/lib/super-admin/proposals/service";
import { PROPOSAL_STATUSES } from "@/lib/super-admin/proposals/workflow";
import { jsonError, requireAdminApi } from "@/lib/super-admin/http";
import { canAccessOwnedResource } from "@/lib/super-admin/rbac/authorize";

type Ctx = { params: Promise<{ id: string }> };

const schema = z.object({
  status: z.enum(PROPOSAL_STATUSES),
});

export async function POST(req: NextRequest, ctx: Ctx) {
  try {
    const user = await requireAdminApi(req, "proposals:update");
    const { id } = await ctx.params;
    const proposal = await getProposal(id);
    if (!proposal) {
      return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
    }
    if (!canAccessOwnedResource(user, proposal.owner_id)) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }
    const body = schema.parse(await req.json());
    await transitionProposal({
      id,
      toStatus: body.status,
      actorUserId: user.id,
      permissions: user.permissions,
      roles: user.roles,
    });
    const updated = await getProposal(id);
    return NextResponse.json({ proposal: updated });
  } catch (error) {
    return jsonError(error);
  }
}
