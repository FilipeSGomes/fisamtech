import fs from "node:fs/promises";
import path from "node:path";
import { getPgPool, getSupabaseAdmin } from "@/lib/db";

export const TICKET_STATUSES = [
  "open",
  "in_progress",
  "awaiting_client",
  "resolved",
  "closed",
] as const;

export type TicketStatus = (typeof TICKET_STATUSES)[number];

export const TICKET_PRIORITIES = [
  "low",
  "medium",
  "high",
  "critical",
] as const;

export type TicketPriority = (typeof TICKET_PRIORITIES)[number];

export type StatusHistoryEntry = {
  status: TicketStatus;
  at: string;
  note?: string;
};

export type SupportTicketRecord = {
  id: string;
  ticket_number: string;
  status: TicketStatus;
  priority: TicketPriority;
  subject: string;
  description: string;
  requester_name: string;
  requester_email: string;
  requester_phone: string;
  company_name: string | null;
  company_cnpj: string | null;
  locale: string;
  status_history: StatusHistoryEntry[];
  created_at: string;
  updated_at: string;
};

export type SupportTicketInsert = {
  priority: TicketPriority;
  subject: string;
  description: string;
  requester_name: string;
  requester_email: string;
  requester_phone: string;
  company_name?: string | null;
  company_cnpj?: string | null;
  locale: string;
};

const FILE_STORE =
  process.env.SUPPORT_TICKETS_FILE ||
  path.join(process.cwd(), "data", "support-tickets.json");

function makeTicketNumber(): string {
  const year = new Date().getFullYear();
  const suffix = crypto.randomUUID().replace(/-/g, "").slice(0, 6).toUpperCase();
  return `FT-${year}-${suffix}`;
}

function initialHistory(): StatusHistoryEntry[] {
  const at = new Date().toISOString();
  return [{ status: "open", at, note: "Chamado registrado." }];
}

async function readFileStore(): Promise<SupportTicketRecord[]> {
  try {
    const raw = await fs.readFile(FILE_STORE, "utf8");
    const parsed = JSON.parse(raw) as SupportTicketRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    const err = e as NodeJS.ErrnoException;
    if (err.code === "ENOENT") return [];
    throw e;
  }
}

async function writeFileStore(tickets: SupportTicketRecord[]): Promise<void> {
  await fs.mkdir(path.dirname(FILE_STORE), { recursive: true });
  await fs.writeFile(FILE_STORE, JSON.stringify(tickets, null, 2), "utf8");
}

function rowToRecord(row: Record<string, unknown>): SupportTicketRecord {
  return {
    id: String(row.id),
    ticket_number: String(row.ticket_number),
    status: row.status as TicketStatus,
    priority: row.priority as TicketPriority,
    subject: String(row.subject),
    description: String(row.description),
    requester_name: String(row.requester_name),
    requester_email: String(row.requester_email),
    requester_phone: String(row.requester_phone),
    company_name: row.company_name ? String(row.company_name) : null,
    company_cnpj: row.company_cnpj ? String(row.company_cnpj) : null,
    locale: String(row.locale ?? "pt-br"),
    status_history: (row.status_history as StatusHistoryEntry[]) ?? [],
    created_at:
      row.created_at instanceof Date
        ? row.created_at.toISOString()
        : String(row.created_at),
    updated_at:
      row.updated_at instanceof Date
        ? row.updated_at.toISOString()
        : String(row.updated_at),
  };
}

export async function insertSupportTicket(
  input: SupportTicketInsert
): Promise<
  | { id: string; ticket_number: string }
  | { id: string; ticket_number: string; error: string; degraded: true }
> {
  const ticket_number = makeTicketNumber();
  const now = new Date().toISOString();
  const status_history = initialHistory();

  const row = {
    ticket_number,
    status: "open" as const,
    priority: input.priority,
    subject: input.subject,
    description: input.description,
    requester_name: input.requester_name,
    requester_email: input.requester_email.trim().toLowerCase(),
    requester_phone: input.requester_phone,
    company_name: input.company_name?.trim() || null,
    company_cnpj: input.company_cnpj?.trim() || null,
    locale: input.locale,
    status_history,
    metadata: { source: "portal" },
  };

  const sb = getSupabaseAdmin();
  if (sb) {
    const { data, error } = await sb
      .from("support_tickets")
      .insert(row)
      .select("id, ticket_number")
      .single();
    if (error) {
      console.warn("[support-tickets] Supabase insert failed — file fallback", error.message);
    } else if (data) {
      return { id: data.id, ticket_number: data.ticket_number };
    }
  }

  const pool = getPgPool();
  if (pool) {
    try {
      const result = await pool.query<{ id: string; ticket_number: string }>(
        `insert into support_tickets
          (ticket_number, status, priority, subject, description,
           requester_name, requester_email, requester_phone,
           company_name, company_cnpj, locale, status_history, metadata)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12::jsonb,$13::jsonb)
         returning id, ticket_number`,
        [
          row.ticket_number,
          row.status,
          row.priority,
          row.subject,
          row.description,
          row.requester_name,
          row.requester_email,
          row.requester_phone,
          row.company_name,
          row.company_cnpj,
          row.locale,
          JSON.stringify(status_history),
          JSON.stringify(row.metadata),
        ]
      );
      return {
        id: result.rows[0].id,
        ticket_number: result.rows[0].ticket_number,
      };
    } catch (e) {
      console.warn("[support-tickets] PG insert failed — file fallback", e);
    }
  }

  const id = crypto.randomUUID();
  const record: SupportTicketRecord = {
    id,
    ticket_number,
    status: "open",
    priority: input.priority,
    subject: input.subject,
    description: input.description,
    requester_name: input.requester_name,
    requester_email: input.requester_email.trim().toLowerCase(),
    requester_phone: input.requester_phone,
    company_name: row.company_name,
    company_cnpj: row.company_cnpj,
    locale: input.locale,
    status_history,
    created_at: now,
    updated_at: now,
  };

  const tickets = await readFileStore();
  tickets.push(record);
  await writeFileStore(tickets);

  const hasDb = Boolean(sb || pool);
  if (hasDb) {
    return {
      id,
      ticket_number,
      error: "Database insert failed; stored in local file",
      degraded: true,
    };
  }

  console.info("[support-tickets] stored in file (no DATABASE_URL):", ticket_number);
  return { id, ticket_number };
}

export async function getSupportTicketByNumberAndEmail(
  ticketNumber: string,
  email: string
): Promise<SupportTicketRecord | null> {
  const normalizedNumber = ticketNumber.trim().toUpperCase();
  const normalizedEmail = email.trim().toLowerCase();

  const sb = getSupabaseAdmin();
  if (sb) {
    const { data, error } = await sb
      .from("support_tickets")
      .select("*")
      .eq("ticket_number", normalizedNumber)
      .ilike("requester_email", normalizedEmail)
      .maybeSingle();
    if (!error && data) return rowToRecord(data);
  }

  const pool = getPgPool();
  if (pool) {
    try {
      const result = await pool.query(
        `select * from support_tickets
         where ticket_number = $1 and lower(requester_email) = $2
         limit 1`,
        [normalizedNumber, normalizedEmail]
      );
      if (result.rows[0]) return rowToRecord(result.rows[0]);
    } catch (e) {
      console.warn("[support-tickets] PG lookup failed — file fallback", e);
    }
  }

  const tickets = await readFileStore();
  return (
    tickets.find(
      (t) =>
        t.ticket_number.toUpperCase() === normalizedNumber &&
        t.requester_email.toLowerCase() === normalizedEmail
    ) ?? null
  );
}

export function publicTicketView(ticket: SupportTicketRecord) {
  return {
    ticket_number: ticket.ticket_number,
    status: ticket.status,
    priority: ticket.priority,
    subject: ticket.subject,
    created_at: ticket.created_at,
    updated_at: ticket.updated_at,
    status_history: ticket.status_history,
    closure_policy:
      "O encerramento do chamado depende de autorização expressa do solicitante.",
  };
}