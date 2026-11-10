import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  LEAD_STATUSES,
  addLeadNote,
  assignLeadOwner,
  findDuplicateLeads,
  getLead,
  listLeadActivities,
  updateLeadStatus,
  type LeadStatus,
} from "@/lib/super-admin/crm/leads";
import { jsonError, requireAdminApi } from "@/lib/super-admin/http";
import { canAccessOwnedResource } from "@/lib/super-admin/rbac/authorize";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, ctx: Ctx) {
  try {
    const user = await requireAdminApi(req, "leads:read");
    const { id } = await ctx.params;
    const lead = await getLead(id);
    if (!lead) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
    if (!canAccessOwnedResource(user, lead.owner_id)) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }
    const [activities, duplicates] = await Promise.all([
      listLeadActivities(id),
      findDuplicateLeads(lead.email),
    ]);
    return NextResponse.json({ lead, activities, duplicates });
  } catch (error) {
    return jsonError(error);
  }
}

const patchSchema = z.object({
  status: z.enum(LEAD_STATUSES).optional(),
  ownerId: z.string().uuid().nullable().optional(),
  note: z.string().min(1).optional(),
  lostReason: z.string().optional(),
  lostNotes: z.string().optional(),
});

export async function PATCH(req: NextRequest, ctx: Ctx) {
  try {
    const user = await requireAdminApi(req, "leads:update");
    const { id } = await ctx.params;
    const lead = await getLead(id);
    if (!lead) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
    if (!canAccessOwnedResource(user, lead.owner_id)) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }
    const body = patchSchema.parse(await req.json());
    if (body.status) {
      await updateLeadStatus({
        id,
        status: body.status as LeadStatus,
        actorUserId: user.id,
        lostReason: body.lostReason,
        lostNotes: body.lostNotes,
      });
    }
    if (body.ownerId !== undefined) {
      await assignLeadOwner({
        id,
        ownerId: body.ownerId,
        actorUserId: user.id,
      });
    }
    if (body.note) {
      await addLeadNote({ leadId: id, actorUserId: user.id, body: body.note });
    }
    const updated = await getLead(id);
    return NextResponse.json({ lead: updated });
  } catch (error) {
    return jsonError(error);
  }
}
