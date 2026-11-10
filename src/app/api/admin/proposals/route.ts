import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  createProposal,
  listProposals,
} from "@/lib/super-admin/proposals/service";
import { jsonError, requireAdminApi } from "@/lib/super-admin/http";

export async function GET(req: NextRequest) {
  try {
    await requireAdminApi(req, "proposals:read");
    const sp = req.nextUrl.searchParams;
    const data = await listProposals({
      q: sp.get("q") || undefined,
      status: sp.get("status") || undefined,
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
  position: z.number().int().optional(),
});

const createSchema = z.object({
  title: z.string().min(2),
  currency: z.string().default("BRL"),
  validUntil: z.string().optional().nullable(),
  opportunityId: z.string().uuid().optional().nullable(),
  companyId: z.string().uuid().optional().nullable(),
  contactId: z.string().uuid().optional().nullable(),
  templateId: z.string().uuid().optional().nullable(),
  ownerId: z.string().uuid().optional().nullable(),
  items: z.array(itemSchema).min(1),
});

export async function POST(req: NextRequest) {
  try {
    const user = await requireAdminApi(req, "proposals:create");
    const body = createSchema.parse(await req.json());
    const id = await createProposal({ ...body, actorUserId: user.id });
    return NextResponse.json({ id }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
