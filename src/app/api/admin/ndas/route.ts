import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { jsonError, requireAdminApi } from "@/lib/super-admin/http";
import { createAndIssueNda, listNdas } from "@/lib/super-admin/nda/service";

export async function GET(req: NextRequest) {
  try {
    await requireAdminApi(req, "ndas:read");
    const sp = req.nextUrl.searchParams;
    const data = await listNdas({
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
  companyId: z.string().uuid().optional().nullable(),
  contactId: z.string().uuid().optional().nullable(),
  opportunityId: z.string().uuid().optional().nullable(),
  clientLegalName: z.string().min(2),
  clientTaxId: z.string().optional().nullable(),
  clientAddress: z.string().optional().nullable(),
  clientRepName: z.string().min(2),
  clientRepTitle: z.string().optional().nullable(),
  projectName: z.string().min(2),
  signedCity: z.string().optional(),
  signedOn: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
});

export async function POST(req: NextRequest) {
  try {
    const user = await requireAdminApi(req, "ndas:create");
    const body = createSchema.parse(await req.json());
    const created = await createAndIssueNda({
      ...body,
      actorUserId: user.id,
    });
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
