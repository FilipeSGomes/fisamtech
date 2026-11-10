import { NextRequest, NextResponse } from "next/server";
import {
  bumpProposalVersion,
  getProposal,
} from "@/lib/super-admin/proposals/service";
import { jsonError, requireAdminApi } from "@/lib/super-admin/http";
import { canAccessOwnedResource } from "@/lib/super-admin/rbac/authorize";

type Ctx = { params: Promise<{ id: string }> };

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
    const version = await bumpProposalVersion({
      id,
      actorUserId: user.id,
    });
    return NextResponse.json({ version });
  } catch (error) {
    return jsonError(error);
  }
}
