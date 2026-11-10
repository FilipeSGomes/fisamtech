import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getContact, updateContact } from "@/lib/super-admin/crm/contacts";
import { jsonError, requireAdminApi } from "@/lib/super-admin/http";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, ctx: Ctx) {
  try {
    await requireAdminApi(req, "contacts:read");
    const { id } = await ctx.params;
    const contact = await getContact(id);
    if (!contact) {
      return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
    }
    return NextResponse.json({ contact });
  } catch (error) {
    return jsonError(error);
  }
}

const patchSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional().nullable(),
  phone: z.string().optional().nullable(),
  roleTitle: z.string().optional().nullable(),
  companyId: z.string().uuid().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export async function PATCH(req: NextRequest, ctx: Ctx) {
  try {
    const user = await requireAdminApi(req, "contacts:update");
    const { id } = await ctx.params;
    const body = patchSchema.parse(await req.json());
    await updateContact({ id, ...body, actorUserId: user.id });
    const contact = await getContact(id);
    return NextResponse.json({ contact });
  } catch (error) {
    return jsonError(error);
  }
}
