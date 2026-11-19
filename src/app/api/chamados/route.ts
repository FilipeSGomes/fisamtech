import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { CONTACT } from "@/lib/config";
import { sendEmail } from "@/lib/email";
import {
  TICKET_PRIORITIES,
  getSupportTicketByNumberAndEmail,
  insertSupportTicket,
  publicTicketView,
} from "@/lib/support-tickets";

const createSchema = z.object({
  name: z.string().trim().min(2).max(200),
  email: z.string().trim().email().max(200),
  phone: z.string().trim().min(8).max(40),
  company_name: z.string().trim().max(200).optional().default(""),
  company_cnpj: z.string().trim().max(32).optional().default(""),
  priority: z.enum(TICKET_PRIORITIES),
  subject: z.string().trim().min(3).max(300),
  description: z.string().trim().min(20).max(10000),
  consent: z.boolean().refine((v) => v === true, {
    message: "consent required",
  }),
  locale: z.string().min(2).max(12).default("pt-br"),
});

const lookupSchema = z.object({
  ticket_number: z.string().trim().min(8).max(32),
  email: z.string().trim().email().max(200),
});

export async function POST(req: NextRequest) {
  try {
    const body = createSchema.parse(await req.json());
    const result = await insertSupportTicket({
      priority: body.priority,
      subject: body.subject,
      description: body.description,
      requester_name: body.name,
      requester_email: body.email,
      requester_phone: body.phone,
      company_name: body.company_name || null,
      company_cnpj: body.company_cnpj || null,
      locale: body.locale,
    });

    if (!("ticket_number" in result)) {
      return NextResponse.json({ error: "Failed" }, { status: 500 });
    }

    const excerpt =
      body.description.length > 280
        ? `${body.description.slice(0, 280)}…`
        : body.description;

    await sendEmail({
      to: CONTACT.email,
      subject: `[Central de Atendimento] Novo chamado ${result.ticket_number}`,
      template: "support_ticket_opened",
      vars: {
        ticket_number: result.ticket_number,
        priority: body.priority,
        subject: body.subject,
        requester_name: body.name,
        requester_email: body.email,
        requester_phone: body.phone,
        description_excerpt: excerpt,
        locale: body.locale,
      },
    });

    await sendEmail({
      to: body.email,
      subject: `Chamado ${result.ticket_number} registrado — FISAM TECH`,
      template: "support_ticket_confirmation",
      vars: {
        ticket_number: result.ticket_number,
        subject: body.subject,
        requester_name: body.name,
        portal_url: "https://fisamtech.com/pt-br/chamados",
      },
    });

    return NextResponse.json({
      ticket_number: result.ticket_number,
      id: result.id,
      degraded: "degraded" in result ? true : false,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Invalid payload";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const params = Object.fromEntries(req.nextUrl.searchParams);
    const query = lookupSchema.parse({
      ticket_number: params.ticket_number ?? params.number ?? "",
      email: params.email ?? "",
    });

    const ticket = await getSupportTicketByNumberAndEmail(
      query.ticket_number,
      query.email
    );
    if (!ticket) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    return NextResponse.json(publicTicketView(ticket));
  } catch (e) {
    const message = e instanceof Error ? e.message : "Invalid payload";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}