import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  addOpportunityNote,
  getOpportunity,
  listOpportunityActivities,
  OPP_STAGES,
  OPP_STATUSES,
  updateOpportunity,
} from "@/lib/super-admin/crm/opportunities";
import { jsonError, requireAdminApi } from "@/lib/super-admin/http";
import { canAccessOwnedResource } from "@/lib/super-admin/rbac/authorize";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, ctx: Ctx) {
  try {
    const user = await requireAdminApi(req, "opportunities:read");
    const { id } = await ctx.params;
    const opportunity = await getOpportunity(id);
    if (!opportunity) {
      return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
    }
    if (!canAccessOwnedResource(user, opportunity.owner_id)) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }
    const activities = await listOpportunityActivities(id);
    return NextResponse.json({ opportunity, activities });
  } catch (error) {
    return jsonError(error);
  }
}

const patchSchema = z.object({
  title: z.string().min(2).optional(),
  service: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  estimatedValue: z.number().optional().nullable(),
  currency: z.string().optional(),
  stage: z.enum(OPP_STAGES).optional(),
  probability: z.number().int().min(0).max(100).optional(),
  expectedCloseDate: z.string().optional().nullable(),
  status: z.enum(OPP_STATUSES).optional(),
  lostReason: z.string().optional().nullable(),
  ownerId: z.string().uuid().optional().nullable(),
  companyId: z.string().uuid().optional().nullable(),
  contactId: z.string().uuid().optional().nullable(),
  nextActionAt: z.string().optional().nullable(),
  nextActionNote: z.string().optional().nullable(),
  note: z.string().min(1).optional(),
});

export async function PATCH(req: NextRequest, ctx: Ctx) {
  try {
    const user = await requireAdminApi(req, "opportunities:update");
    const { id } = await ctx.params;
    const opportunity = await getOpportunity(id);
    if (!opportunity) {
      return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
    }
    if (!canAccessOwnedResource(user, opportunity.owner_id)) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }
    const body = patchSchema.parse(await req.json());
    const { note, ...rest } = body;
    await updateOpportunity({ id, ...rest, actorUserId: user.id });
    if (note) {
      await addOpportunityNote({
        opportunityId: id,
        actorUserId: user.id,
        body: note,
      });
    }
    const updated = await getOpportunity(id);
    return NextResponse.json({ opportunity: updated });
  } catch (error) {
    return jsonError(error);
  }
}
