import { adminQuery, withAdminTransaction } from "@/lib/db";
import { writeAudit } from "@/lib/super-admin/audit/write";
import { getLead } from "@/lib/super-admin/crm/leads";
import {
  OPP_STAGE_LABELS,
  OPP_STAGES,
  OPP_STATUSES,
  type OppStage,
  type OppStatus,
} from "@/lib/super-admin/crm/opportunity-status";

export {
  OPP_STAGE_LABELS,
  OPP_STAGES,
  OPP_STATUSES,
  type OppStage,
  type OppStatus,
};

export type OpportunityRow = {
  id: string;
  created_at: Date;
  updated_at: Date;
  company_id: string | null;
  company_name: string | null;
  contact_id: string | null;
  contact_name: string | null;
  lead_id: string | null;
  owner_id: string | null;
  owner_name: string | null;
  title: string;
  service: string | null;
  description: string | null;
  estimated_value: string | null;
  currency: string;
  stage: OppStage;
  probability: number;
  expected_close_date: string | null;
  source: string | null;
  next_action_at: Date | null;
  next_action_note: string | null;
  status: OppStatus;
  lost_reason: string | null;
  created_by: string | null;
};

export async function listOpportunities(opts: {
  q?: string;
  status?: string;
  stage?: string;
  ownerId?: string;
  page?: number;
  pageSize?: number;
}): Promise<{
  items: OpportunityRow[];
  total: number;
  page: number;
  pageSize: number;
}> {
  const page = Math.max(1, opts.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, opts.pageSize ?? 20));
  const clauses: string[] = [];
  const values: unknown[] = [];
  if (opts.q) {
    values.push(`%${opts.q}%`);
    const i = values.length;
    clauses.push(
      `(o.title ilike $${i} or coalesce(o.service,'') ilike $${i} or coalesce(co.legal_name,'') ilike $${i})`
    );
  }
  if (opts.status) {
    values.push(opts.status);
    clauses.push(`o.status = $${values.length}`);
  }
  if (opts.stage) {
    values.push(opts.stage);
    clauses.push(`o.stage = $${values.length}`);
  }
  if (opts.ownerId) {
    values.push(opts.ownerId);
    clauses.push(`o.owner_id = $${values.length}`);
  }
  const whereSql = clauses.length ? `where ${clauses.join(" and ")}` : "";
  const totalResult = await adminQuery<{ n: number }>(
    `select count(*)::int as n
     from opportunities o
     left join companies co on co.id = o.company_id
     ${whereSql}`,
    values
  );
  const total = totalResult.rows[0]?.n ?? 0;
  const offset = (page - 1) * pageSize;
  values.push(pageSize, offset);
  const items = await adminQuery<OpportunityRow>(
    `select o.*,
            co.legal_name as company_name,
            ct.name as contact_name,
            u.name as owner_name,
            o.estimated_value::text as estimated_value
     from opportunities o
     left join companies co on co.id = o.company_id
     left join contacts ct on ct.id = o.contact_id
     left join admin_users u on u.id = o.owner_id
     ${whereSql}
     order by o.updated_at desc
     limit $${values.length - 1} offset $${values.length}`,
    values
  );
  return { items: items.rows, total, page, pageSize };
}

export async function getOpportunity(id: string): Promise<OpportunityRow | null> {
  const result = await adminQuery<OpportunityRow>(
    `select o.*,
            co.legal_name as company_name,
            ct.name as contact_name,
            u.name as owner_name,
            o.estimated_value::text as estimated_value
     from opportunities o
     left join companies co on co.id = o.company_id
     left join contacts ct on ct.id = o.contact_id
     left join admin_users u on u.id = o.owner_id
     where o.id = $1`,
    [id]
  );
  return result.rows[0] ?? null;
}

export async function createOpportunity(opts: {
  title: string;
  service?: string | null;
  description?: string | null;
  estimatedValue?: number | null;
  currency?: string;
  stage?: OppStage;
  probability?: number;
  expectedCloseDate?: string | null;
  source?: string | null;
  companyId?: string | null;
  contactId?: string | null;
  leadId?: string | null;
  ownerId?: string | null;
  nextActionAt?: string | null;
  nextActionNote?: string | null;
  actorUserId: string;
}): Promise<string> {
  const result = await adminQuery<{ id: string }>(
    `insert into opportunities (
       company_id, contact_id, lead_id, owner_id, title, service, description,
       estimated_value, currency, stage, probability, expected_close_date, source,
       next_action_at, next_action_note, created_by
     ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
     returning id`,
    [
      opts.companyId ?? null,
      opts.contactId ?? null,
      opts.leadId ?? null,
      opts.ownerId ?? opts.actorUserId,
      opts.title.trim(),
      opts.service?.trim() || null,
      opts.description?.trim() || null,
      opts.estimatedValue ?? null,
      opts.currency ?? "BRL",
      opts.stage ?? "QUALIFICATION",
      opts.probability ?? 10,
      opts.expectedCloseDate ?? null,
      opts.source ?? null,
      opts.nextActionAt ?? null,
      opts.nextActionNote ?? null,
      opts.actorUserId,
    ]
  );
  const id = result.rows[0].id;
  await adminQuery(
    `insert into crm_activities (actor_user_id, opportunity_id, company_id, activity_type, subject, body)
     values ($1,$2,$3,'SYSTEM','Oportunidade criada',$4)`,
    [opts.actorUserId, id, opts.companyId ?? null, opts.title.trim()]
  );
  await writeAudit({
    action: "OPPORTUNITY_CREATED",
    actorUserId: opts.actorUserId,
    resourceType: "opportunity",
    resourceId: id,
  });
  return id;
}

export async function updateOpportunity(opts: {
  id: string;
  title?: string;
  service?: string | null;
  description?: string | null;
  estimatedValue?: number | null;
  currency?: string;
  stage?: OppStage;
  probability?: number;
  expectedCloseDate?: string | null;
  status?: OppStatus;
  lostReason?: string | null;
  ownerId?: string | null;
  companyId?: string | null;
  contactId?: string | null;
  nextActionAt?: string | null;
  nextActionNote?: string | null;
  actorUserId: string;
}): Promise<void> {
  const current = await getOpportunity(opts.id);
  if (!current) throw new Error("Oportunidade não encontrada");

  if (opts.status === "LOST" || opts.stage === "LOST") {
    if (!opts.lostReason && !current.lost_reason) {
      throw new Error("Motivo de perda obrigatório");
    }
  }

  let nextStatus = opts.status;
  if (!nextStatus && opts.stage === "WON") nextStatus = "WON";
  if (!nextStatus && opts.stage === "LOST") nextStatus = "LOST";

  await adminQuery(
    `update opportunities set
       title = coalesce($2, title),
       service = case when $3::boolean then $4 else service end,
       description = case when $5::boolean then $6 else description end,
       estimated_value = case when $7::boolean then $8 else estimated_value end,
       currency = coalesce($9, currency),
       stage = coalesce($10, stage),
       probability = coalesce($11, probability),
       expected_close_date = case when $12::boolean then $13 else expected_close_date end,
       status = coalesce($14, status),
       lost_reason = case when $15::boolean then $16 else lost_reason end,
       owner_id = case when $17::boolean then $18 else owner_id end,
       company_id = case when $19::boolean then $20 else company_id end,
       contact_id = case when $21::boolean then $22 else contact_id end,
       next_action_at = case when $23::boolean then $24 else next_action_at end,
       next_action_note = case when $25::boolean then $26 else next_action_note end,
       updated_at = now()
     where id = $1`,
    [
      opts.id,
      opts.title?.trim() ?? null,
      opts.service !== undefined,
      opts.service?.trim() || null,
      opts.description !== undefined,
      opts.description?.trim() || null,
      opts.estimatedValue !== undefined,
      opts.estimatedValue,
      opts.currency ?? null,
      opts.stage ?? null,
      opts.probability ?? null,
      opts.expectedCloseDate !== undefined,
      opts.expectedCloseDate,
      nextStatus ?? null,
      opts.lostReason !== undefined,
      opts.lostReason,
      opts.ownerId !== undefined,
      opts.ownerId,
      opts.companyId !== undefined,
      opts.companyId,
      opts.contactId !== undefined,
      opts.contactId,
      opts.nextActionAt !== undefined,
      opts.nextActionAt,
      opts.nextActionNote !== undefined,
      opts.nextActionNote,
    ]
  );

  if (opts.stage && opts.stage !== current.stage) {
    await adminQuery(
      `insert into crm_activities (actor_user_id, opportunity_id, company_id, activity_type, subject, metadata)
       values ($1,$2,$3,'STATUS_CHANGE',$4,$5::jsonb)`,
      [
        opts.actorUserId,
        opts.id,
        current.company_id,
        `Estágio: ${OPP_STAGE_LABELS[current.stage]} → ${OPP_STAGE_LABELS[opts.stage]}`,
        JSON.stringify({ from: current.stage, to: opts.stage }),
      ]
    );
  }

  await writeAudit({
    action: "OPPORTUNITY_UPDATED",
    actorUserId: opts.actorUserId,
    resourceType: "opportunity",
    resourceId: opts.id,
    context: { stage: opts.stage, status: nextStatus },
  });
}

export async function addOpportunityNote(opts: {
  opportunityId: string;
  actorUserId: string;
  body: string;
}): Promise<void> {
  const opp = await getOpportunity(opts.opportunityId);
  if (!opp) throw new Error("Oportunidade não encontrada");
  await adminQuery(
    `insert into crm_activities (actor_user_id, opportunity_id, company_id, activity_type, subject, body)
     values ($1,$2,$3,'NOTE','Nota interna',$4)`,
    [opts.actorUserId, opts.opportunityId, opp.company_id, opts.body]
  );
}

export async function listOpportunityActivities(opportunityId: string) {
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
     where a.opportunity_id = $1
     order by a.created_at desc
     limit 200`,
    [opportunityId]
  );
  return result.rows;
}

/** Convert a lead into company + contact + opportunity in one transaction. */
export async function convertLeadToOpportunity(opts: {
  leadId: string;
  title?: string;
  actorUserId: string;
}): Promise<{ opportunityId: string; companyId: string; contactId: string }> {
  const lead = await getLead(opts.leadId);
  if (!lead) throw new Error("Lead não encontrado");

  return withAdminTransaction(async (client) => {
    let companyId = lead.company_id ?? null;
    if (!companyId && lead.company) {
      const existing = await client.query<{ id: string }>(
        `select id from companies where lower(legal_name) = lower($1) limit 1`,
        [lead.company.trim()]
      );
      if (existing.rows[0]) {
        companyId = existing.rows[0].id;
      } else {
        const created = await client.query<{ id: string }>(
          `insert into companies (legal_name, country, created_by)
           values ($1,$2,$3) returning id`,
          [lead.company.trim(), lead.country, opts.actorUserId]
        );
        companyId = created.rows[0].id;
      }
    } else if (!companyId) {
      const created = await client.query<{ id: string }>(
        `insert into companies (legal_name, country, created_by)
         values ($1,$2,$3) returning id`,
        [lead.name, lead.country, opts.actorUserId]
      );
      companyId = created.rows[0].id;
    }

    let contactId = lead.contact_id ?? null;
    if (!contactId) {
      const byEmail = await client.query<{ id: string }>(
        `select id from contacts where email_normalized = lower(trim($1)) limit 1`,
        [lead.email]
      );
      if (byEmail.rows[0]) {
        contactId = byEmail.rows[0].id;
      } else {
        const created = await client.query<{ id: string }>(
          `insert into contacts (
             company_id, name, email, email_normalized, phone, phone_normalized,
             role_title, created_by
           ) values ($1,$2,$3,lower(trim($3)),$4,$5,$6,$7)
           returning id`,
          [
            companyId,
            lead.name,
            lead.email,
            lead.phone,
            lead.phone ? lead.phone.replace(/\D/g, "") || null : null,
            lead.role,
            opts.actorUserId,
          ]
        );
        contactId = created.rows[0].id;
      }
    }

    const title =
      opts.title?.trim() ||
      `Oportunidade — ${lead.company || lead.name}`;

    const opp = await client.query<{ id: string }>(
      `insert into opportunities (
         company_id, contact_id, lead_id, owner_id, title, service, description,
         currency, stage, source, created_by
       ) values ($1,$2,$3,$4,$5,$6,$7,$8,'QUALIFICATION',$9,$10)
       returning id`,
      [
        companyId,
        contactId,
        lead.id,
        lead.owner_id ?? opts.actorUserId,
        title,
        lead.service_interest,
        lead.challenge,
        lead.currency || "BRL",
        lead.source,
        opts.actorUserId,
      ]
    );
    const opportunityId = opp.rows[0].id;

    await client.query(
      `update leads
       set company_id = $2, contact_id = $3,
           status = case when status in ('NEW','CONTACTED') then 'QUALIFIED' else status end,
           updated_at = now()
       where id = $1`,
      [lead.id, companyId, contactId]
    );

    await client.query(
      `insert into crm_activities (actor_user_id, lead_id, opportunity_id, company_id, activity_type, subject, body)
       values ($1,$2,$3,$4,'SYSTEM','Lead convertido em oportunidade',$5)`,
      [opts.actorUserId, lead.id, opportunityId, companyId, title]
    );

    return { opportunityId, companyId: companyId!, contactId: contactId! };
  }).then(async (result) => {
    await writeAudit({
      action: "LEAD_CONVERTED",
      actorUserId: opts.actorUserId,
      resourceType: "lead",
      resourceId: opts.leadId,
      context: result,
    });
    return result;
  });
}
