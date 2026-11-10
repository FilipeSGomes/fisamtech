import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  getProposal,
  listProposalItems,
  updateProposalDraft,
} from "@/lib/super-admin/proposals/service";
import { jsonError, requireAdminApi } from "@/lib/super-admin/http";
import { canAccessOwnedResource } from "@/lib/super-admin/rbac/authorize";

type Ctx = { params: Promise<{ id: string }> };

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
    const items = await listProposalItems(id);
    return NextResponse.json({ proposal, items });
  } catch (error) {
    return jsonError(error);
  }
}

const itemSchema = z.object({
  description: z.string().min(1),
  quantity: z.number().positive(),
  unit: z.string().optional(),
  unitPrice: z.union([z.number(), z.string()]),
  discount: z.union([z.number(), z.string()]).optional(),
  position: z.number().int().optional(),
});

const patchSchema = z.object({
  title: z.string().min(2).optional(),
  currency: z.string().optional(),
  validUntil: z.string().optional().nullable(),
  companyId: z.string().uuid().optional().nullable(),
  contactId: z.string().uuid().optional().nullable(),
  opportunityId: z.string().uuid().optional().nullable(),
  templateId: z.string().uuid().optional().nullable(),
  items: z.array(itemSchema).min(1).optional(),
});

export async function PATCH(req: NextRequest, ctx: Ctx) {
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
    const body = patchSchema.parse(await req.json());
    await updateProposalDraft({ id, ...body, actorUserId: user.id });
    const updated = await getProposal(id);
    const items = await listProposalItems(id);
    return NextResponse.json({ proposal: updated, items });
  } catch (error) {
    return jsonError(error);
  }
}
