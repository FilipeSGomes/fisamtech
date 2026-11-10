import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  createContact,
  listContacts,
} from "@/lib/super-admin/crm/contacts";
import { jsonError, requireAdminApi } from "@/lib/super-admin/http";

export async function GET(req: NextRequest) {
  try {
    await requireAdminApi(req, "contacts:read");
    const sp = req.nextUrl.searchParams;
    const data = await listContacts({
      q: sp.get("q") || undefined,
      companyId: sp.get("companyId") || undefined,
      page: Number(sp.get("page") || 1),
      pageSize: Number(sp.get("pageSize") || 20),
    });
    return NextResponse.json(data);
  } catch (error) {
    return jsonError(error);
  }
}

const createSchema = z.object({
  name: z.string().min(2),
  email: z.string().email().optional().nullable(),
  phone: z.string().optional().nullable(),
  roleTitle: z.string().optional().nullable(),
  companyId: z.string().uuid().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export async function POST(req: NextRequest) {
  try {
    const user = await requireAdminApi(req, "contacts:create");
    const body = createSchema.parse(await req.json());
    const id = await createContact({ ...body, actorUserId: user.id });
    return NextResponse.json({ id }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
