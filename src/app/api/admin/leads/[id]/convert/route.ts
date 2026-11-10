import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getLead } from "@/lib/super-admin/crm/leads";
import { convertLeadToOpportunity } from "@/lib/super-admin/crm/opportunities";
import { jsonError, requireAdminApi } from "@/lib/super-admin/http";
import { canAccessOwnedResource } from "@/lib/super-admin/rbac/authorize";

type Ctx = { params: Promise<{ id: string }> };

const schema = z.object({
  title: z.string().optional(),
});

export async function POST(req: NextRequest, ctx: Ctx) {
  try {
    const user = await requireAdminApi(req, "opportunities:create");
    const { id } = await ctx.params;
    const lead = await getLead(id);
    if (!lead) {
      return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
    }
    if (!canAccessOwnedResource(user, lead.owner_id)) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }
    const body = schema.parse(await req.json().catch(() => ({})));
    const result = await convertLeadToOpportunity({
      leadId: id,
      title: body.title,
      actorUserId: user.id,
    });
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
