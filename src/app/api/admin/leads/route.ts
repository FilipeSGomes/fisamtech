import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { adminQuery } from "@/lib/db";
import { writeAudit } from "@/lib/super-admin/audit/write";
import { normalizeEmail } from "@/lib/super-admin/auth/password";
import { listLeads } from "@/lib/super-admin/crm/leads";
import { jsonError, requireAdminApi } from "@/lib/super-admin/http";

export async function GET(req: NextRequest) {
  try {
    await requireAdminApi(req, "leads:read");
    const sp = req.nextUrl.searchParams;
    const data = await listLeads({
      q: sp.get("q") || undefined,
      status: sp.get("status") || undefined,
      source: sp.get("source") || undefined,
      ownerId: sp.get("ownerId") || undefined,
      page: Number(sp.get("page") || 1),
      pageSize: Number(sp.get("pageSize") || 20),
      sort: sp.get("sort") || undefined,
      order: sp.get("order") === "asc" ? "asc" : "desc",
    });
    return NextResponse.json(data);
  } catch (error) {
    return jsonError(error);
  }
}

const createSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  company: z.string().optional(),
  phone: z.string().optional(),
  role: z.string().optional(),
  challenge: z.string().optional(),
  budget_range: z.string().optional(),
  currency: z.string().default("BRL"),
  country: z.string().default("BR"),
  locale: z.string().default("pt-br"),
  source: z.string().default("manual"),
  service_interest: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const user = await requireAdminApi(req, "leads:create");
    const body = createSchema.parse(await req.json());
    const result = await adminQuery<{ id: string }>(
      `insert into leads (
         name, email, company, phone, role, challenge, budget_range, currency,
         country, locale, source, service_interest, status, email_normalized,
         phone_normalized, owner_id
       ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,'NEW',$13,$14,$15)
       returning id`,
      [
        body.name,
        body.email,
        body.company ?? null,
        body.phone ?? null,
        body.role ?? null,
        body.challenge ?? null,
        body.budget_range ?? null,
        body.currency,
        body.country,
        body.locale,
        body.source,
        body.service_interest ?? null,
        normalizeEmail(body.email),
        body.phone ? body.phone.replace(/\D/g, "") || null : null,
        user.id,
      ]
    );
    const id = result.rows[0].id;
    await writeAudit({
      action: "LEAD_CREATED",
      actorUserId: user.id,
      resourceType: "lead",
      resourceId: id,
    });
    return NextResponse.json({ id }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
