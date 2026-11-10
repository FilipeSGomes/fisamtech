import { adminQuery } from "@/lib/db";
import { writeAudit } from "@/lib/super-admin/audit/write";
import { normalizeEmail } from "@/lib/super-admin/auth/password";
import {
  LEAD_STATUSES,
  LEAD_STATUS_LABELS,
  type LeadStatus,
} from "@/lib/super-admin/crm/lead-status";

export { LEAD_STATUSES, LEAD_STATUS_LABELS, type LeadStatus };

export type LeadRow = {
  id: string;
  created_at: Date;
  updated_at: Date;
  name: string;
  email: string;
  company: string | null;
  country: string | null;
  locale: string;
  currency: string;
  role: string | null;
  challenge: string | null;
  budget_range: string | null;
  source: string;
  phone: string | null;
  status: LeadStatus;
  owner_id: string | null;
  owner_name: string | null;
  next_action_at: Date | null;
  next_action_note: string | null;
  lost_reason: string | null;
  service_interest: string | null;
};

const SORT_WHITELIST = new Set([
  "created_at",
  "updated_at",
  "name",
  "email",
  "status",
  "company",
]);

export async function listLeads(opts: {
  q?: string;
  status?: string;
  source?: string;
  ownerId?: string;
  page?: number;
  pageSize?: number;
  sort?: string;
  order?: "asc" | "desc";
}): Promise<{ items: LeadRow[]; total: number; page: number; pageSize: number }> {
  const page = Math.max(1, opts.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, opts.pageSize ?? 20));
  const sort = SORT_WHITELIST.has(opts.sort || "") ? (opts.sort as string) : "created_at";
  const order = opts.order === "asc" ? "asc" : "desc";

  const clauses: string[] = [];
  const values: unknown[] = [];
  if (opts.q) {
    values.push(`%${opts.q}%`);
    const i = values.length;
    clauses.push(
      `(l.name ilike $${i} or l.email ilike $${i} or coalesce(l.company,'') ilike $${i})`
    );
  }
  if (opts.status) {
    values.push(opts.status);
    clauses.push(`l.status = $${values.length}`);
  }
  if (opts.source) {
    values.push(opts.source);
    clauses.push(`l.source = $${values.length}`);
  }
  if (opts.ownerId) {
    values.push(opts.ownerId);
    clauses.push(`l.owner_id = $${values.length}`);
  }
  const whereSql = clauses.length ? `where ${clauses.join(" and ")}` : "";

  const totalResult = await adminQuery<{ n: number }>(
    `select count(*)::int as n from leads l ${whereSql}`,
    values
  );
  const total = totalResult.rows[0]?.n ?? 0;
  const offset = (page - 1) * pageSize;
  values.push(pageSize, offset);

  const items = await adminQuery<LeadRow>(
    `select l.id, l.created_at, l.updated_at, l.name, l.email, l.company, l.country,
            l.locale, l.currency, l.role, l.challenge, l.budget_range, l.source, l.phone,
            l.status, l.owner_id, u.name as owner_name, l.next_action_at, l.next_action_note,
            l.lost_reason, l.service_interest
     from leads l
     left join admin_users u on u.id = l.owner_id
     ${whereSql}
     order by l.${sort} ${order}
     limit $${values.length - 1} offset $${values.length}`,
    values
  );

  return { items: items.rows, total, page, pageSize };
}

export async function getLead(id: string): Promise<LeadRow | null> {
  const result = await adminQuery<LeadRow>(
    `select l.id, l.created_at, l.updated_at, l.name, l.email, l.company, l.country,
            l.locale, l.currency, l.role, l.challenge, l.budget_range, l.source, l.phone,
            l.status, l.owner_id, u.name as owner_name, l.next_action_at, l.next_action_note,
            l.lost_reason, l.service_interest
     from leads l
     left join admin_users u on u.id = l.owner_id
     where l.id = $1`,
    [id]
  );
  return result.rows[0] ?? null;
}

export async function updateLeadStatus(opts: {
  id: string;
  status: LeadStatus;
  actorUserId: string;
  lostReason?: string;
  lostNotes?: string;
}): Promise<void> {
  if (!LEAD_STATUSES.includes(opts.status)) throw new Error("Invalid status");
  if (opts.status === "LOST" && !opts.lostReason) {
    throw new Error("Motivo de perda obrigatório");
  }
  const before = await getLead(opts.id);
  if (!before) throw new Error("Lead not found");

  await adminQuery(
    `update leads
     set status = $2,
         lost_reason = $3,
         lost_notes = $4,
         updated_at = now()
     where id = $1`,
    [
      opts.id,
      opts.status,
      opts.status === "LOST" ? opts.lostReason ?? null : null,
      opts.status === "LOST" ? opts.lostNotes ?? null : null,
    ]
  );

  await adminQuery(
    `insert into crm_activities (actor_user_id, lead_id, activity_type, subject, body, metadata)
     values ($1,$2,'STATUS_CHANGE',$3,$4,$5::jsonb)`,
    [
      opts.actorUserId,
      opts.id,
      `Status: ${LEAD_STATUS_LABELS[before.status]} → ${LEAD_STATUS_LABELS[opts.status]}`,
      opts.lostNotes ?? null,
      JSON.stringify({ from: before.status, to: opts.status }),
    ]
  );

  await writeAudit({
    action: "LEAD_UPDATED",
    actorUserId: opts.actorUserId,
    resourceType: "lead",
    resourceId: opts.id,
    context: { status: opts.status },
  });
}

export async function assignLeadOwner(opts: {
  id: string;
  ownerId: string | null;
  actorUserId: string;
}): Promise<void> {
  await adminQuery(
    `update leads set owner_id = $2, updated_at = now() where id = $1`,
    [opts.id, opts.ownerId]
  );
  await writeAudit({
    action: "LEAD_UPDATED",
    actorUserId: opts.actorUserId,
    resourceType: "lead",
    resourceId: opts.id,
    context: { owner_id: opts.ownerId },
  });
}

export async function addLeadNote(opts: {
  leadId: string;
  actorUserId: string;
  body: string;
}): Promise<void> {
  await adminQuery(
    `insert into crm_activities (actor_user_id, lead_id, activity_type, subject, body)
     values ($1,$2,'NOTE','Nota interna',$3)`,
    [opts.actorUserId, opts.leadId, opts.body]
  );
  await writeAudit({
    action: "LEAD_UPDATED",
    actorUserId: opts.actorUserId,
    resourceType: "lead",
    resourceId: opts.leadId,
    context: { note: true },
  });
}

export async function listLeadActivities(leadId: string): Promise<
  Array<{
    id: string;
    created_at: Date;
    activity_type: string;
    subject: string | null;
    body: string | null;
    actor_name: string | null;
  }>
> {
  const result = await adminQuery<{
    id: string;
    created_at: Date;
    activity_type: string;
    subject: string | null;
    body: string | null;
    actor_name: string | null;
  }>(
    `select a.id, a.created_at, a.activity_type, a.subject, a.body, u.name as actor_name
     from crm_activities a
     left join admin_users u on u.id = a.actor_user_id
     where a.lead_id = $1
     order by a.created_at desc
     limit 200`,
    [leadId]
  );
  return result.rows;
}

export async function findDuplicateLeads(email: string): Promise<
  Array<{
    id: string;
    name: string;
    email: string;
    company: string | null;
    status: string;
    created_at: Date;
  }>
> {
  const normalized = normalizeEmail(email);
  const result = await adminQuery<{
    id: string;
    name: string;
    email: string;
    company: string | null;
    status: string;
    created_at: Date;
  }>(
    `select id, name, email, company, status, created_at
     from leads
     where email_normalized = $1
     order by created_at desc
     limit 20`,
    [normalized]
  );
  return result.rows;
}

/** Ensure public inserts also fill CRM defaults / normalization. */
export async function enrichPublicLeadFields(lead: {
  email: string;
  phone?: string | null;
}): Promise<{ email_normalized: string; phone_normalized: string | null; status: "NEW" }> {
  return {
    email_normalized: normalizeEmail(lead.email),
    phone_normalized: lead.phone ? lead.phone.replace(/\D/g, "") || null : null,
    status: "NEW",
  };
}
