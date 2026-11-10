import { NextRequest, NextResponse } from "next/server";
import {
  generateAndStoreProposalPdf,
  getProposal,
  loadProposalPdf,
} from "@/lib/super-admin/proposals/service";
import { jsonError, requireAdminApi } from "@/lib/super-admin/http";
import { canAccessOwnedResource } from "@/lib/super-admin/rbac/authorize";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, ctx: Ctx) {
  try {
    const user = await requireAdminApi(req, "proposals:export");
    const { id } = await ctx.params;
    const proposal = await getProposal(id);
    if (!proposal) {
      return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
    }
    if (!canAccessOwnedResource(user, proposal.owner_id)) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }
    const stored = await generateAndStoreProposalPdf({
      id,
      actorUserId: user.id,
    });
    return NextResponse.json(stored);
  } catch (error) {
    return jsonError(error);
  }
}

export async function GET(req: NextRequest, ctx: Ctx) {
  try {
    const user = await requireAdminApi(req, "proposals:read");
    const { id } = await ctx.params;
    const proposal = await getProposal(id);
    if (!proposal) {
      return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
    }
    if (!canAccessOwnedResource(user, proposal.owner_id)) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    let pdf = await loadProposalPdf({ proposalId: proposal.id });
    // allow regenerate on demand if missing
    if (!pdf) {
      await generateAndStoreProposalPdf({ id, actorUserId: user.id });
      pdf = await loadProposalPdf({ proposalId: proposal.id });
    }
    if (!pdf) {
      return NextResponse.json({ error: "PDF indisponível" }, { status: 404 });
    }

    return new NextResponse(new Uint8Array(pdf.bytes), {
      status: 200,
      headers: {
        "Content-Type": pdf.contentType,
        "Content-Disposition": `attachment; filename="${proposal.number_display}.pdf"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    return jsonError(error);
  }
}
