import { adminQuery, withAdminTransaction } from "@/lib/db";
import { writeAudit } from "@/lib/super-admin/audit/write";
import { allocateProposalNumber } from "@/lib/super-admin/proposals/numbering";
import { generateProposalPdf } from "@/lib/super-admin/proposals/pdf";
import { storeProposalPdf, loadProposalPdf } from "@/lib/super-admin/proposals/storage";
import {
  computeProposalTotals,
  type ProposalItemInput,
} from "@/lib/super-admin/proposals/totals";
import {
  assertProposalTransition,
  PROPOSAL_STATUS_LABELS,
  requiresApprovePermission,
  requiresSendPermission,
  type ProposalStatus,
} from "@/lib/super-admin/proposals/workflow";
import { sendEmail } from "@/lib/email";

export type ProposalRow = {
  id: string;
  created_at: Date;
  updated_at: Date;
  number_year: number;
  number_seq: number;
  number_display: string;
  current_version: number;
  status: ProposalStatus;
  opportunity_id: string | null;
  company_id: string | null;
  company_name: string | null;
  contact_id: string | null;
  contact_name: string | null;
  contact_email: string | null;
  owner_id: string | null;
  owner_name: string | null;
  template_id: string | null;
  template_name: string | null;
  title: string;
  currency: string;
  valid_until: string | null;
  created_by: string | null;
  subtotal: string | null;
  discount_total: string | null;
  total: string | null;
};

export type ProposalItemRow = {
  id: string;
  proposal_id: string;
  version: number;
  position: number;
  description: string;
  quantity: string;
  unit: string;
  unit_price: string;
  discount: string;
  line_total: string;
};

export async function listProposalTemplates() {
  const result = await adminQuery<{
    id: string;
    code: string;
    name: string;
    description: string | null;
  }>(
    `select id, code, name, description from proposal_templates where active = true order by name`
  );
  return result.rows;
}

export async function listProposals(opts: {
  q?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}): Promise<{ items: ProposalRow[]; total: number; page: number; pageSize: number }> {
  const page = Math.max(1, opts.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, opts.pageSize ?? 20));
  const clauses: string[] = [];
  const values: unknown[] = [];
  if (opts.q) {
    values.push(`%${opts.q}%`);
    const i = values.length;
    clauses.push(
      `(p.title ilike $${i} or p.number_display ilike $${i} or coalesce(co.legal_name,'') ilike $${i})`
    );
  }
  if (opts.status) {
    values.push(opts.status);
    clauses.push(`p.status = $${values.length}`);
  }
  const whereSql = clauses.length ? `where ${clauses.join(" and ")}` : "";
  const totalResult = await adminQuery<{ n: number }>(
    `select count(*)::int as n
     from proposals p
     left join companies co on co.id = p.company_id
     ${whereSql}`,
    values
  );
  const total = totalResult.rows[0]?.n ?? 0;
  const offset = (page - 1) * pageSize;
  values.push(pageSize, offset);
  const items = await adminQuery<ProposalRow>(
    `select p.*,
            co.legal_name as company_name,
            ct.name as contact_name,
            ct.email as contact_email,
            u.name as owner_name,
            t.name as template_name,
            pv.subtotal::text as subtotal,
            pv.discount_total::text as discount_total,
            pv.total::text as total
     from proposals p
     left join companies co on co.id = p.company_id
     left join contacts ct on ct.id = p.contact_id
     left join admin_users u on u.id = p.owner_id
     left join proposal_templates t on t.id = p.template_id
     left join proposal_versions pv
       on pv.proposal_id = p.id and pv.version = p.current_version
     ${whereSql}
     order by p.created_at desc
     limit $${values.length - 1} offset $${values.length}`,
    values
  );
  return { items: items.rows, total, page, pageSize };
}

export async function getProposal(id: string): Promise<ProposalRow | null> {
  const result = await adminQuery<ProposalRow>(
    `select p.*,
            co.legal_name as company_name,
            ct.name as contact_name,
            ct.email as contact_email,
            u.name as owner_name,
            t.name as template_name,
            pv.subtotal::text as subtotal,
            pv.discount_total::text as discount_total,
            pv.total::text as total
     from proposals p
     left join companies co on co.id = p.company_id
     left join contacts ct on ct.id = p.contact_id
     left join admin_users u on u.id = p.owner_id
     left join proposal_templates t on t.id = p.template_id
     left join proposal_versions pv
       on pv.proposal_id = p.id and pv.version = p.current_version
     where p.id = $1`,
    [id]
  );
  return result.rows[0] ?? null;
}

export async function listProposalItems(
  proposalId: string,
  version?: number
): Promise<ProposalItemRow[]> {
  const result = await adminQuery<ProposalItemRow>(
    version
      ? `select id, proposal_id, version, position, description,
                quantity::text, unit, unit_price::text, discount::text, line_total::text
         from proposal_items
         where proposal_id = $1 and version = $2
         order by position asc`
      : `select i.id, i.proposal_id, i.version, i.position, i.description,
                i.quantity::text, i.unit, i.unit_price::text, i.discount::text, i.line_total::text
         from proposal_items i
         join proposals p on p.id = i.proposal_id and i.version = p.current_version
         where i.proposal_id = $1
         order by i.position asc`,
    version ? [proposalId, version] : [proposalId]
  );
  return result.rows;
}

async function replaceItems(
  client: { query: typeof adminQuery },
  proposalId: string,
  version: number,
  items: ProposalItemInput[]
) {
  const totals = computeProposalTotals(items);
  await client.query(
    `delete from proposal_items where proposal_id = $1 and version = $2`,
    [proposalId, version]
  );
  for (const item of totals.items) {
    await client.query(
      `insert into proposal_items (
         proposal_id, version, position, description, quantity, unit,
         unit_price, discount, line_total
       ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [
        proposalId,
        version,
        item.position,
        item.description,
        item.quantity,
        item.unit,
        item.unitPrice,
        item.discount,
        item.lineTotal,
      ]
    );
  }
  return totals;
}

export async function createProposal(opts: {
  title: string;
  currency?: string;
  validUntil?: string | null;
  opportunityId?: string | null;
  companyId?: string | null;
  contactId?: string | null;
  templateId?: string | null;
  ownerId?: string | null;
  items: ProposalItemInput[];
  actorUserId: string;
}): Promise<string> {
  if (!opts.items.length) throw new Error("Inclua ao menos um item");
  const totals = computeProposalTotals(opts.items);

  const id = await withAdminTransaction(async (client) => {
    const number = await allocateProposalNumber(client);
    const created = await client.query<{ id: string }>(
      `insert into proposals (
         number_year, number_seq, number_display, current_version, status,
         opportunity_id, company_id, contact_id, owner_id, template_id,
         title, currency, valid_until, created_by
       ) values ($1,$2,$3,1,'DRAFT',$4,$5,$6,$7,$8,$9,$10,$11,$12)
       returning id`,
      [
        number.year,
        number.seq,
        number.display,
        opts.opportunityId ?? null,
        opts.companyId ?? null,
        opts.contactId ?? null,
        opts.ownerId ?? opts.actorUserId,
        opts.templateId ?? null,
        opts.title.trim(),
        opts.currency ?? "BRL",
        opts.validUntil ?? null,
        opts.actorUserId,
      ]
    );
    const proposalId = created.rows[0].id;

    await client.query(
      `insert into proposal_versions (
         proposal_id, version, status_at_issue, snapshot, subtotal, discount_total, total, currency, immutable
       ) values ($1,1,'DRAFT',$2::jsonb,$3,$4,$5,$6,false)`,
      [
        proposalId,
        JSON.stringify({ title: opts.title, items: totals.items }),
        totals.subtotal,
        totals.discountTotal,
        totals.total,
        opts.currency ?? "BRL",
      ]
    );

    for (const item of totals.items) {
      await client.query(
        `insert into proposal_items (
           proposal_id, version, position, description, quantity, unit,
           unit_price, discount, line_total
         ) values ($1,1,$2,$3,$4,$5,$6,$7,$8)`,
        [
          proposalId,
          item.position,
          item.description,
          item.quantity,
          item.unit,
          item.unitPrice,
          item.discount,
          item.lineTotal,
        ]
      );
    }

    return proposalId;
  });

  await writeAudit({
    action: "PROPOSAL_CREATED",
    actorUserId: opts.actorUserId,
    resourceType: "proposal",
    resourceId: id,
  });
  return id;
}

export async function updateProposalDraft(opts: {
  id: string;
  title?: string;
  currency?: string;
  validUntil?: string | null;
  companyId?: string | null;
  contactId?: string | null;
  opportunityId?: string | null;
  templateId?: string | null;
  items?: ProposalItemInput[];
  actorUserId: string;
}): Promise<void> {
  const proposal = await getProposal(opts.id);
  if (!proposal) throw new Error("Proposta não encontrada");
  if (proposal.status !== "DRAFT" && proposal.status !== "IN_REVIEW") {
    throw new Error("Somente rascunho/em revisão podem ser editados");
  }

  await withAdminTransaction(async (client) => {
    await client.query(
      `update proposals set
         title = coalesce($2, title),
         currency = coalesce($3, currency),
         valid_until = case when $4::boolean then $5 else valid_until end,
         company_id = case when $6::boolean then $7 else company_id end,
         contact_id = case when $8::boolean then $9 else contact_id end,
         opportunity_id = case when $10::boolean then $11 else opportunity_id end,
         template_id = case when $12::boolean then $13 else template_id end,
         updated_at = now()
       where id = $1`,
      [
        opts.id,
        opts.title?.trim() ?? null,
        opts.currency ?? null,
        opts.validUntil !== undefined,
        opts.validUntil ?? null,
        opts.companyId !== undefined,
        opts.companyId,
        opts.contactId !== undefined,
        opts.contactId,
        opts.opportunityId !== undefined,
        opts.opportunityId,
        opts.templateId !== undefined,
        opts.templateId,
      ]
    );

    if (opts.items) {
      const totals = await replaceItems(
        client,
        opts.id,
        proposal.current_version,
        opts.items
      );
      await client.query(
        `update proposal_versions set
           snapshot = $3::jsonb,
           subtotal = $4,
           discount_total = $5,
           total = $6,
           currency = coalesce($7, currency)
         where proposal_id = $1 and version = $2 and immutable = false`,
        [
          opts.id,
          proposal.current_version,
          JSON.stringify({ title: opts.title ?? proposal.title, items: totals.items }),
          totals.subtotal,
          totals.discountTotal,
          totals.total,
          opts.currency ?? proposal.currency,
        ]
      );
    }
  });

  await writeAudit({
    action: "PROPOSAL_UPDATED",
    actorUserId: opts.actorUserId,
    resourceType: "proposal",
    resourceId: opts.id,
  });
}

export async function transitionProposal(opts: {
  id: string;
  toStatus: ProposalStatus;
  actorUserId: string;
  permissions: string[];
  roles: string[];
}): Promise<void> {
  const proposal = await getProposal(opts.id);
  if (!proposal) throw new Error("Proposta não encontrada");
  assertProposalTransition(proposal.status, opts.toStatus);

  const isElevated =
    opts.roles.includes("SUPER_ADMIN") || opts.roles.includes("ADMIN");
  if (requiresApprovePermission(opts.toStatus) && !isElevated) {
    if (!opts.permissions.includes("proposals:approve")) {
      throw new Error("Permissão proposals:approve necessária");
    }
  }
  if (requiresSendPermission(opts.toStatus) && !isElevated) {
    if (!opts.permissions.includes("proposals:send")) {
      throw new Error("Permissão proposals:send necessária");
    }
  }

  await adminQuery(
    `update proposals set status = $2, updated_at = now() where id = $1`,
    [opts.id, opts.toStatus]
  );
  await writeAudit({
    action: "PROPOSAL_STATUS_CHANGED",
    actorUserId: opts.actorUserId,
    resourceType: "proposal",
    resourceId: opts.id,
    context: {
      from: proposal.status,
      to: opts.toStatus,
      label: PROPOSAL_STATUS_LABELS[opts.toStatus],
    },
  });
}

export async function bumpProposalVersion(opts: {
  id: string;
  actorUserId: string;
}): Promise<number> {
  const proposal = await getProposal(opts.id);
  if (!proposal) throw new Error("Proposta não encontrada");
  if (!["DRAFT", "IN_REVIEW", "REJECTED", "EXPIRED", "CANCELLED"].includes(proposal.status)) {
    throw new Error("Não é possível versionar neste status");
  }

  const nextVersion = await withAdminTransaction(async (client) => {
    const items = await client.query<{
      description: string;
      quantity: string;
      unit: string;
      unit_price: string;
      discount: string;
      position: number;
    }>(
      `select description, quantity::text, unit, unit_price::text, discount::text, position
       from proposal_items where proposal_id = $1 and version = $2 order by position`,
      [opts.id, proposal.current_version]
    );
    const mapped: ProposalItemInput[] = items.rows.map((r) => ({
      description: r.description,
      quantity: Number(r.quantity),
      unit: r.unit,
      unitPrice: r.unit_price,
      discount: r.discount,
      position: r.position,
    }));
    const totals = computeProposalTotals(mapped);
    const version = proposal.current_version + 1;

    await client.query(
      `insert into proposal_versions (
         proposal_id, version, status_at_issue, snapshot, subtotal, discount_total, total, currency, immutable
       ) values ($1,$2,'DRAFT',$3::jsonb,$4,$5,$6,$7,false)`,
      [
        opts.id,
        version,
        JSON.stringify({ title: proposal.title, items: totals.items }),
        totals.subtotal,
        totals.discountTotal,
        totals.total,
        proposal.currency,
      ]
    );
    for (const item of totals.items) {
      await client.query(
        `insert into proposal_items (
           proposal_id, version, position, description, quantity, unit,
           unit_price, discount, line_total
         ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        [
          opts.id,
          version,
          item.position,
          item.description,
          item.quantity,
          item.unit,
          item.unitPrice,
          item.discount,
          item.lineTotal,
        ]
      );
    }
    await client.query(
      `update proposals set current_version = $2, status = 'DRAFT', updated_at = now() where id = $1`,
      [opts.id, version]
    );
    return version;
  });

  await writeAudit({
    action: "PROPOSAL_VERSIONED",
    actorUserId: opts.actorUserId,
    resourceType: "proposal",
    resourceId: opts.id,
    context: { version: nextVersion },
  });
  return nextVersion;
}

export async function generateAndStoreProposalPdf(opts: {
  id: string;
  actorUserId: string;
}): Promise<{ documentId: string; storageKey: string }> {
  const proposal = await getProposal(opts.id);
  if (!proposal) throw new Error("Proposta não encontrada");
  const items = await listProposalItems(opts.id, proposal.current_version);
  if (!items.length) throw new Error("Proposta sem itens");

  const bytes = await generateProposalPdf({
    numberDisplay: proposal.number_display,
    title: proposal.title,
    version: proposal.current_version,
    currency: proposal.currency,
    validUntil: proposal.valid_until,
    companyName: proposal.company_name,
    contactName: proposal.contact_name,
    contactEmail: proposal.contact_email,
    items: items.map((i) => ({
      description: i.description,
      quantity: Number(i.quantity),
      unit: i.unit,
      unitPrice: i.unit_price,
      discount: i.discount,
      lineTotal: i.line_total,
    })),
    subtotal: proposal.subtotal || "0.00",
    discountTotal: proposal.discount_total || "0.00",
    total: proposal.total || "0.00",
  });

  const stored = await storeProposalPdf({
    proposalId: opts.id,
    version: proposal.current_version,
    numberDisplay: proposal.number_display,
    bytes,
    actorUserId: opts.actorUserId,
  });

  await adminQuery(
    `update proposal_versions
     set immutable = true, issued_at = now(), issued_by = $3, status_at_issue = $4
     where proposal_id = $1 and version = $2`,
    [opts.id, proposal.current_version, opts.actorUserId, proposal.status]
  );

  await writeAudit({
    action: "PROPOSAL_PDF_GENERATED",
    actorUserId: opts.actorUserId,
    resourceType: "proposal",
    resourceId: opts.id,
    context: { documentId: stored.documentId, version: proposal.current_version },
  });

  return stored;
}

export async function sendProposalEmail(opts: {
  id: string;
  toEmail?: string;
  actorUserId: string;
  permissions: string[];
  roles: string[];
}): Promise<{ status: "sent" | "pending_config" | "failed"; reason?: string }> {
  const isElevated =
    opts.roles.includes("SUPER_ADMIN") || opts.roles.includes("ADMIN");
  if (!isElevated && !opts.permissions.includes("proposals:send")) {
    throw new Error("Permissão proposals:send necessária");
  }

  const proposal = await getProposal(opts.id);
  if (!proposal) throw new Error("Proposta não encontrada");
  if (!["APPROVED", "SENT", "VIEWED"].includes(proposal.status)) {
    throw new Error("Proposta precisa estar aprovada para envio");
  }

  let pdf = await loadProposalPdf({
    proposalId: opts.id,
    version: proposal.current_version,
  });
  if (!pdf) {
    await generateAndStoreProposalPdf({
      id: opts.id,
      actorUserId: opts.actorUserId,
    });
    pdf = await loadProposalPdf({
      proposalId: opts.id,
      version: proposal.current_version,
    });
  }
  if (!pdf) throw new Error("Falha ao preparar PDF");

  const to = (opts.toEmail || proposal.contact_email || "").trim();
  if (!to) throw new Error("E-mail do destinatário obrigatório");

  const subject = `Proposta ${proposal.number_display} — FISAM TECH`;
  const result = await sendEmail({
    to,
    subject,
    template: "proposal_sent",
    vars: {
      number: proposal.number_display,
      title: proposal.title,
      total: `${proposal.currency} ${proposal.total || "0.00"}`,
      company: proposal.company_name || "",
    },
  });

  const status: "sent" | "pending_config" | "failed" = result.sent
    ? "sent"
    : result.reason?.includes("RESEND_API_KEY")
      ? "pending_config"
      : "failed";

  const doc = await adminQuery<{ id: string }>(
    `select id from proposal_documents
     where proposal_id = $1 and version = $2
     order by created_at desc limit 1`,
    [opts.id, proposal.current_version]
  );

  await adminQuery(
    `insert into proposal_sends (
       proposal_id, version, to_email, subject, status, error_reason, sent_by, document_id
     ) values ($1,$2,$3,$4,$5,$6,$7,$8)`,
    [
      opts.id,
      proposal.current_version,
      to,
      subject,
      status,
      result.reason ?? null,
      opts.actorUserId,
      doc.rows[0]?.id ?? null,
    ]
  );

  if (status === "sent" && proposal.status === "APPROVED") {
    await adminQuery(
      `update proposals set status = 'SENT', updated_at = now() where id = $1`,
      [opts.id]
    );
  }

  await writeAudit({
    action: "PROPOSAL_SENT",
    actorUserId: opts.actorUserId,
    resourceType: "proposal",
    resourceId: opts.id,
    result: status === "sent" ? "success" : "failure",
    context: { status, to, reason: result.reason },
  });

  return { status, reason: result.reason };
}

export { loadProposalPdf };
