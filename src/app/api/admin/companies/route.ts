import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  createCompany,
  listCompanies,
} from "@/lib/super-admin/crm/companies";
import { jsonError, requireAdminApi } from "@/lib/super-admin/http";

export async function GET(req: NextRequest) {
  try {
    await requireAdminApi(req, "companies:read");
    const sp = req.nextUrl.searchParams;
    const data = await listCompanies({
      q: sp.get("q") || undefined,
      page: Number(sp.get("page") || 1),
      pageSize: Number(sp.get("pageSize") || 20),
    });
    return NextResponse.json(data);
  } catch (error) {
    return jsonError(error);
  }
}

const createSchema = z.object({
  legalName: z.string().min(2),
  tradeName: z.string().optional().nullable(),
  taxId: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
  website: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export async function POST(req: NextRequest) {
  try {
    const user = await requireAdminApi(req, "companies:create");
    const body = createSchema.parse(await req.json());
    const id = await createCompany({ ...body, actorUserId: user.id });
    return NextResponse.json({ id }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
