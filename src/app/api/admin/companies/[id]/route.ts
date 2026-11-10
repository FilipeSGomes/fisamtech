import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  getCompany,
  updateCompany,
} from "@/lib/super-admin/crm/companies";
import { jsonError, requireAdminApi } from "@/lib/super-admin/http";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, ctx: Ctx) {
  try {
    await requireAdminApi(req, "companies:read");
    const { id } = await ctx.params;
    const company = await getCompany(id);
    if (!company) {
      return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
    }
    return NextResponse.json({ company });
  } catch (error) {
    return jsonError(error);
  }
}

const patchSchema = z.object({
  legalName: z.string().min(2).optional(),
  tradeName: z.string().optional().nullable(),
  taxId: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
  website: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export async function PATCH(req: NextRequest, ctx: Ctx) {
  try {
    const user = await requireAdminApi(req, "companies:update");
    const { id } = await ctx.params;
    const body = patchSchema.parse(await req.json());
    await updateCompany({ id, ...body, actorUserId: user.id });
    const company = await getCompany(id);
    return NextResponse.json({ company });
  } catch (error) {
    return jsonError(error);
  }
}
