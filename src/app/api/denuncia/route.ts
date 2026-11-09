import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { insertWhistleblowingReport } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { CONTACT } from "@/lib/config";

const CATEGORIES = [
  "corruption",
  "fraud",
  "harassment",
  "conflict_of_interest",
  "irregularity",
  "other",
] as const;

const RELATIONS = ["employee", "supplier", "client", "other"] as const;

const schema = z
  .object({
    category: z.enum(CATEGORIES),
    description: z.string().trim().min(20).max(10000),
    approximate_date: z.string().trim().max(64).optional().default(""),
    relation: z.enum(RELATIONS),
    anonymous: z.boolean(),
    name: z.string().trim().max(200).optional().default(""),
    email: z.string().trim().max(200).optional().default(""),
    phone: z.string().trim().max(40).optional().default(""),
    consent: z.boolean().optional().default(false),
    locale: z.string().min(2).max(12).default("pt-br"),
  })
  .superRefine((data, ctx) => {
    if (data.email) {
      const parsed = z.string().email().safeParse(data.email);
      if (!parsed.success) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Invalid email",
          path: ["email"],
        });
      }
    }

    if (data.anonymous) return;

    const identified = Boolean(data.name || data.email || data.phone);
    if (identified && !data.consent) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "LGPD consent required when identifying yourself",
        path: ["consent"],
      });
    }
  });

export async function POST(req: NextRequest) {
  try {
    const body = schema.parse(await req.json());

    const anonymous = body.anonymous;
    const report = {
      category: body.category,
      description: body.description,
      approximate_date: body.approximate_date || null,
      relation: body.relation,
      anonymous,
      reporter_name: anonymous ? null : body.name || null,
      reporter_email: anonymous ? null : body.email || null,
      reporter_phone: anonymous ? null : body.phone || null,
      locale: body.locale,
      consent: anonymous ? false : Boolean(body.consent),
    };

    const result = await insertWhistleblowingReport(report);
    if (!("protocol" in result)) {
      return NextResponse.json({ error: "Failed" }, { status: 500 });
    }

    const excerpt =
      body.description.length > 280
        ? `${body.description.slice(0, 280)}…`
        : body.description;

    await sendEmail({
      to: CONTACT.email,
      subject: `[Canal de Denúncias] Novo protocolo ${result.protocol}`,
      template: "whistleblowing_alert",
      vars: {
        protocol: result.protocol,
        category: body.category,
        relation: body.relation,
        anonymous: String(anonymous),
        approximate_date: body.approximate_date || "—",
        locale: body.locale,
        description_excerpt: excerpt,
      },
    });

    return NextResponse.json({
      protocol: result.protocol,
      id: result.id,
      degraded: "degraded" in result ? true : false,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Invalid payload";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
