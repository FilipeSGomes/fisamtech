import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { jsonError, requireAdminApi } from "@/lib/super-admin/http";
import {
  createAndIssueContract,
  listContracts,
} from "@/lib/super-admin/contracts/service";

export async function GET(req: NextRequest) {
  try {
    await requireAdminApi(req, "contracts:read");
    const sp = req.nextUrl.searchParams;
    const data = await listContracts({
      q: sp.get("q") || undefined,
      page: Number(sp.get("page") || 1),
      pageSize: Number(sp.get("pageSize") || 20),
    });
    return NextResponse.json(data);
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
});

const createSchema = z.object({
  proposalId: z.string().uuid().optional().nullable(),
  companyId: z.string().uuid().optional().nullable(),
  contactId: z.string().uuid().optional().nullable(),
  opportunityId: z.string().uuid().optional().nullable(),
  clientLegalName: z.string().min(2),
  clientTaxId: z.string().optional().nullable(),
  clientAddress: z.string().optional().nullable(),
  clientRepName: z.string().min(2),
  clientRepTitle: z.string().optional().nullable(),
  projectName: z.string().min(2),
  currency: z.string().optional(),
  paymentTerms: z.string().optional(),
  termMonths: z.number().int().positive().optional(),
  startOn: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .nullable(),
  signedCity: z.string().optional(),
  signedOn: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  notes: z.string().optional().nullable(),
  items: z.array(itemSchema).min(1),
});

export async function POST(req: NextRequest) {
  try {
    const user = await requireAdminApi(req, "contracts:create");
    const body = createSchema.parse(await req.json());
    const created = await createAndIssueContract({
      ...body,
      actorUserId: user.id,
    });
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
