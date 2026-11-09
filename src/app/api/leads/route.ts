import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { BUDGET_RANGE_IDS } from "@/lib/config";
import { insertLead, trackEventServer } from "@/lib/db";

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  company: z.string().optional(),
  country: z.string().min(2),
  locale: z.string(),
  currency: z.string(),
  role: z.string().optional(),
  challenge: z.string().optional(),
  budget_range: z.enum(BUDGET_RANGE_IDS).optional(),
  source: z.string().default("qualification"),
  phone: z.string().optional(),
});

export async function POST(req: NextRequest) {
  let body: z.infer<typeof schema>;
  try {
    body = schema.parse(await req.json());
  } catch (e) {
    const message = e instanceof Error ? e.message : "Invalid payload";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  try {
    const result = await insertLead(body);
    if ("id" in result) {
      await trackEventServer({
        name: "qualification_submitted",
        lead_id: result.id,
        locale: body.locale,
        properties: { country: body.country, currency: body.currency },
      });
      return NextResponse.json({
        id: result.id,
        degraded: "degraded" in result ? true : false,
      });
    }
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Database error";
    console.error("[api/leads]", message);
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
