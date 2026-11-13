import { createHash } from "node:crypto";
import type pg from "pg";
import { adminQuery, withAdminTransaction } from "@/lib/db";
import { writeAudit } from "@/lib/super-admin/audit/write";
import { generateServiceContractPdf } from "@/lib/super-admin/contracts/pdf";
import {
  computeProposalTotals,
  type ProposalItemInput,
} from "@/lib/super-admin/proposals/totals";
import {
  getProposal,
  listProposalItems,
} from "@/lib/super-admin/proposals/service";

export type ContractItem = {
  description: string;
  quantity: number;
  unit: string;
  unitPrice: string;
  discount: string;
  lineTotal: string;
};

export type ContractRow = {
  id: string;
  created_at: Date;
  number_display: string;
  status: string;
  proposal_id: string | null;
  client_legal_name: string;
  client_tax_id: string | null;
  client_rep_name: string;
  project_name: string;
  company_id: string | null;
  contact_id: string | null;
  currency: string;
  total: string;
  signed_on: string;
  signed_city: string;
};

async function allocateContractNumber(
  client: pg.PoolClient,
  year = new Date().getUTCFullYear()
): Promise<{ year: number; seq: number; display: string }> {
  await client.query(
    `insert into service_contract_number_counters (year, last_value)
     values ($1, 0)
     on conflict (year) do nothing`,
    [year]
  );
  const result = await client.query<{ last_value: number }>(
    `update service_contract_number_counters
     set last_value = last_value + 1
     where year = $1
     returning last_value`,
    [year]
  );
  const seq = result.rows[0].last_value;
  return {
    year,
    seq,
    display: `CTR-${year}-${String(seq).padStart(4, "0")}`,
  };
}

function formatDateLabel(dateIso: string): string {
  const d = new Date(`${dateIso}T12:00:00`);
  return d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function normalizeItems(items: ProposalItemInput[]): {
  items: ContractItem[];
  subtotal: string;
  discountTotal: string;
  total: string;
} {
  const totals = computeProposalTotals(items);
  return {
    items: totals.items.map((i) => ({
      description: i.description,
      quantity: i.quantity,
      unit: i.unit,
      unitPrice: i.unitPrice,
      discount: i.discount,
      lineTotal: i.lineTotal,
    })),
    subtotal: totals.subtotal,
    discountTotal: totals.discountTotal,
    total: totals.total,
  };
}

export async function listContracts(opts: {
  q?: string;
  page?: number;
  pageSize?: number;
}): Promise<{
  items: ContractRow[];
  total: number;
  page: number;
  pageSize: number;
}> {
  const page = Math.max(1, opts.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, opts.pageSize ?? 20));
  const values: unknown[] = [];
  const clauses: string[] = [];
  if (opts.q) {
    values.push(`%${opts.q}%`);
    const i = values.length;
    clauses.push(
      `(number_display ilike $${i} or client_legal_name ilike $${i} or project_name ilike $${i})`
    );
  }
  const whereSql = clauses.length ? `where ${clauses.join(" and ")}` : "";
  const total =
    (
      await adminQuery<{ n: number }>(
        `select count(*)::int as n from service_contracts ${whereSql}`,
        values
      )
    ).rows[0]?.n ?? 0;
  values.push(pageSize, (page - 1) * pageSize);
  const items = await adminQuery<ContractRow>(
    `select id, created_at, number_display, status, proposal_id, client_legal_name,
            client_tax_id, client_rep_name, project_name, company_id, contact_id,
            currency, total::text, signed_on::text, signed_city
     from service_contracts
     ${whereSql}
     order by created_at desc
     limit $${values.length - 1} offset $${values.length}`,
    values
  );
  return { items: items.rows, total, page, pageSize };
}

export async function getContract(id: string) {
  const result = await adminQuery(
    `select * from service_contracts where id = $1`,
    [id]
  );
  return result.rows[0] ?? null;
}

export async function createAndIssueContract(opts: {
  actorUserId: string;
  proposalId?: string | null;
  companyId?: string | null;
  contactId?: string | null;
  opportunityId?: string | null;
  clientLegalName: string;
  clientTaxId?: string | null;
  clientAddress?: string | null;
  clientRepName: string;
  clientRepTitle?: string | null;
  projectName: string;
  currency?: string;
  paymentTerms?: string;
  termMonths?: number;
  startOn?: string | null;
  signedCity?: string;
  signedOn?: string;
  notes?: string | null;
  items?: ProposalItemInput[];
}): Promise<{ id: string; numberDisplay: string }> {
  let proposalNumber: string | null = null;
  let companyId = opts.companyId ?? null;
  let contactId = opts.contactId ?? null;
  let opportunityId = opts.opportunityId ?? null;
  let clientLegalName = opts.clientLegalName.trim();
  let clientTaxId = opts.clientTaxId?.trim() || null;
  let clientRepName = opts.clientRepName.trim();
  let clientRepTitle = opts.clientRepTitle?.trim() || null;
  let projectName = opts.projectName.trim();
  let currency = opts.currency?.trim() || "BRL";
  let itemsInput = opts.items;

  if (opts.proposalId) {
    const proposal = await getProposal(opts.proposalId);
    if (!proposal) throw new Error("Proposta não encontrada");
    proposalNumber = proposal.number_display;
    companyId = companyId || proposal.company_id;
    contactId = contactId || proposal.contact_id;
    opportunityId = opportunityId || proposal.opportunity_id;
    currency = currency || proposal.currency || "BRL";
    if (!projectName) projectName = proposal.title;
    if (!clientLegalName && proposal.company_name) {
      clientLegalName = proposal.company_name;
    }
    if (!clientRepName && proposal.contact_name) {
      clientRepName = proposal.contact_name;
    }
    if (!itemsInput?.length) {
      const rows = await listProposalItems(opts.proposalId);
      itemsInput = rows.map((r) => ({
        description: r.description,
        quantity: Number(r.quantity),
        unit: r.unit,
        unitPrice: r.unit_price,
        discount: r.discount,
      }));
    }
    if (!clientTaxId && companyId) {
      const company = await adminQuery<{ tax_id: string | null }>(
        `select tax_id from companies where id = $1`,
        [companyId]
      );
      clientTaxId = company.rows[0]?.tax_id || null;
    }
  }

  if (!clientLegalName) throw new Error("Razão social do cliente obrigatória");
  if (!clientRepName) throw new Error("Representante do cliente obrigatório");
  if (!projectName) throw new Error("Nome do projeto obrigatório");
  if (!itemsInput?.length) throw new Error("Informe ao menos um item");

  const computed = normalizeItems(itemsInput);
  const signedOn =
    opts.signedOn ||
    new Date().toLocaleDateString("en-CA", {
      timeZone: "America/Sao_Paulo",
    });
  const signedCity = opts.signedCity?.trim() || "Embu Guaçu - SP";
  const paymentTerms =
    opts.paymentTerms?.trim() ||
    "50% na assinatura e 50% na entrega/aceite";
  const termMonths = Math.max(1, opts.termMonths ?? 12);
  const startOn = opts.startOn || null;
  const startOnLabel = startOn ? formatDateLabel(startOn) : null;

  return withAdminTransaction(async (client) => {
    const num = await allocateContractNumber(client);
    const inserted = await client.query<{ id: string }>(
      `insert into service_contracts (
         number_year, number_seq, number_display, status,
         proposal_id, company_id, contact_id, opportunity_id,
         client_legal_name, client_tax_id, client_address,
         client_rep_name, client_rep_title, project_name,
         currency, payment_terms, term_months, start_on,
         items, subtotal, discount_total, total,
         signed_city, signed_on, notes, created_by
       ) values (
         $1,$2,$3,'ISSUED',$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,
         $17::date,$18::jsonb,$19,$20,$21,$22,$23::date,$24,$25
       )
       returning id`,
      [
        num.year,
        num.seq,
        num.display,
        opts.proposalId ?? null,
        companyId,
        contactId,
        opportunityId,
        clientLegalName,
        clientTaxId,
        opts.clientAddress?.trim() || null,
        clientRepName,
        clientRepTitle,
        projectName,
        currency,
        paymentTerms,
        termMonths,
        startOn,
        JSON.stringify(computed.items),
        computed.subtotal,
        computed.discountTotal,
        computed.total,
        signedCity,
        signedOn,
        opts.notes?.trim() || null,
        opts.actorUserId,
      ]
    );
    const id = inserted.rows[0].id;

    const bytes = await generateServiceContractPdf({
      numberDisplay: num.display,
      clientLegalName,
      clientTaxId,
      clientAddress: opts.clientAddress,
      clientRepName,
      clientRepTitle,
      projectName,
      currency,
      paymentTerms,
      termMonths,
      startOnLabel,
      proposalNumber,
      items: computed.items,
      subtotal: computed.subtotal,
      discountTotal: computed.discountTotal,
      total: computed.total,
      signedCity,
      signedOnLabel: formatDateLabel(signedOn),
    });

    const checksum = createHash("sha256").update(bytes).digest("hex");
    const storageKey = `${id}/${num.display}.pdf`;
    await client.query(
      `update service_contracts
       set pdf_bytes = $2,
           storage_key = $3,
           byte_size = $4,
           checksum_sha256 = $5,
           updated_at = now()
       where id = $1`,
      [id, bytes, storageKey, bytes.length, checksum]
    );

    await writeAudit({
      action: "CONTRACT_CREATED",
      actorUserId: opts.actorUserId,
      resourceType: "service_contract",
      resourceId: id,
      context: {
        number: num.display,
        proposalId: opts.proposalId ?? null,
        proposalNumber,
      },
    });

    return { id, numberDisplay: num.display };
  });
}

export async function loadContractPdf(id: string): Promise<{
  bytes: Buffer;
  numberDisplay: string;
  contentType: string;
} | null> {
  const result = await adminQuery<{
    number_display: string;
    content_type: string;
    pdf_bytes: Buffer | null;
  }>(
    `select number_display, content_type, pdf_bytes
     from service_contracts where id = $1`,
    [id]
  );
  const row = result.rows[0];
  if (!row?.pdf_bytes) return null;
  const bytes = Buffer.isBuffer(row.pdf_bytes)
    ? row.pdf_bytes
    : Buffer.from(row.pdf_bytes as unknown as Uint8Array);
  return {
    bytes,
    numberDisplay: row.number_display,
    contentType: row.content_type || "application/pdf",
  };
}
