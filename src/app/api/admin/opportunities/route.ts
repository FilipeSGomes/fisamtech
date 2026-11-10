import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  createOpportunity,
  listOpportunities,
  OPP_STAGES,
} from "@/lib/super-admin/crm/opportunities";
import { jsonError, requireAdminApi } from "@/lib/super-admin/http";

export async function GET(req: NextRequest) {
  try {
    await requireAdminApi(req, "opportunities:read");
    const sp = req.nextUrl.searchParams;
    const data = await listOpportunities({
      q: sp.get("q") || undefined,
      status: sp.get("status") || undefined,
      stage: sp.get("stage") || undefined,
      ownerId: sp.get("ownerId") || undefined,
      page: Number(sp.get("page") || 1),
      pageSize: Number(sp.get("pageSize") || 20),
    });
    return NextResponse.json(data);
  } catch (error) {
    return jsonError(error);
  }
}

const createSchema = z.object({
  title: z.string().min(2),
  service: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  estimatedValue: z.number().optional().nullable(),
  currency: z.string().default("BRL"),
  stage: z.enum(OPP_STAGES).optional(),
  probability: z.number().int().min(0).max(100).optional(),
  expectedCloseDate: z.string().optional().nullable(),
  source: z.string().optional().nullable(),
  companyId: z.string().uuid().optional().nullable(),
  contactId: z.string().uuid().optional().nullable(),
  leadId: z.string().uuid().optional().nullable(),
  ownerId: z.string().uuid().optional().nullable(),
  nextActionAt: z.string().optional().nullable(),
  nextActionNote: z.string().optional().nullable(),
});

export async function POST(req: NextRequest) {
  try {
    const user = await requireAdminApi(req, "opportunities:create");
    const body = createSchema.parse(await req.json());
    const id = await createOpportunity({ ...body, actorUserId: user.id });
    return NextResponse.json({ id }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
