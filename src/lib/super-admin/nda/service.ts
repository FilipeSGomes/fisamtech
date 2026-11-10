import { createHash } from "node:crypto";
import type pg from "pg";
import { adminQuery, withAdminTransaction } from "@/lib/db";
import { writeAudit } from "@/lib/super-admin/audit/write";
import { generateUnilateralNdaPdf } from "@/lib/super-admin/nda/pdf";

export type NdaRow = {
  id: string;
  created_at: Date;
  number_display: string;
  status: string;
  client_legal_name: string;
  client_tax_id: string | null;
  client_rep_name: string;
  project_name: string;
  company_id: string | null;
  contact_id: string | null;
  signed_on: string;
  signed_city: string;
};

async function allocateNdaNumber(
  client: pg.PoolClient,
  year = new Date().getUTCFullYear()
): Promise<{ year: number; seq: number; display: string }> {
  await client.query(
    `insert into nda_number_counters (year, last_value)
     values ($1, 0)
     on conflict (year) do nothing`,
    [year]
  );
  const result = await client.query<{ last_value: number }>(
    `update nda_number_counters
     set last_value = last_value + 1
     where year = $1
     returning last_value`,
    [year]
  );
  const seq = result.rows[0].last_value;
  return {
    year,
    seq,
    display: `NDA-${year}-${String(seq).padStart(4, "0")}`,
  };
}

function formatSignedOnLabel(dateIso: string): string {
  const d = new Date(`${dateIso}T12:00:00`);
  return d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export async function listNdas(opts: {
  q?: string;
  page?: number;
  pageSize?: number;
}): Promise<{ items: NdaRow[]; total: number; page: number; pageSize: number }> {
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
  const total = (
    await adminQuery<{ n: number }>(
      `select count(*)::int as n from nda_documents ${whereSql}`,
      values
    )
  ).rows[0]?.n ?? 0;
  values.push(pageSize, (page - 1) * pageSize);
  const items = await adminQuery<NdaRow>(
    `select id, created_at, number_display, status, client_legal_name, client_tax_id,
            client_rep_name, project_name, company_id, contact_id, signed_on::text, signed_city
     from nda_documents
     ${whereSql}
     order by created_at desc
     limit $${values.length - 1} offset $${values.length}`,
    values
  );
  return { items: items.rows, total, page, pageSize };
}

export async function getNda(id: string) {
  const result = await adminQuery(
    `select * from nda_documents where id = $1`,
    [id]
  );
  return result.rows[0] ?? null;
}

export async function createAndIssueNda(opts: {
  actorUserId: string;
  companyId?: string | null;
  contactId?: string | null;
  opportunityId?: string | null;
  clientLegalName: string;
  clientTaxId?: string | null;
  clientAddress?: string | null;
  clientRepName: string;
  clientRepTitle?: string | null;
  projectName: string;
  signedCity?: string;
  signedOn?: string; // YYYY-MM-DD
}): Promise<{ id: string; numberDisplay: string }> {
  const signedOn =
    opts.signedOn ||
    new Date().toLocaleDateString("en-CA", {
      timeZone: "America/Sao_Paulo",
    });
  const signedCity = opts.signedCity?.trim() || "Embu Guaçu - SP";

  return withAdminTransaction(async (client) => {
    const num = await allocateNdaNumber(client);
    const inserted = await client.query<{ id: string }>(
      `insert into nda_documents (
         number_year, number_seq, number_display, status,
         company_id, contact_id, opportunity_id,
         client_legal_name, client_tax_id, client_address,
         client_rep_name, client_rep_title, project_name,
         signed_city, signed_on, created_by
       ) values ($1,$2,$3,'ISSUED',$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14::date,$15)
       returning id`,
      [
        num.year,
        num.seq,
        num.display,
        opts.companyId ?? null,
        opts.contactId ?? null,
        opts.opportunityId ?? null,
        opts.clientLegalName.trim(),
        opts.clientTaxId?.trim() || null,
        opts.clientAddress?.trim() || null,
        opts.clientRepName.trim(),
        opts.clientRepTitle?.trim() || null,
        opts.projectName.trim(),
        signedCity,
        signedOn,
        opts.actorUserId,
      ]
    );
    const id = inserted.rows[0].id;

    const bytes = await generateUnilateralNdaPdf({
      numberDisplay: num.display,
      clientLegalName: opts.clientLegalName.trim(),
      clientTaxId: opts.clientTaxId,
      clientAddress: opts.clientAddress,
      clientRepName: opts.clientRepName.trim(),
      clientRepTitle: opts.clientRepTitle,
      projectName: opts.projectName.trim(),
      signedCity,
      signedOnLabel: formatSignedOnLabel(signedOn),
    });

    const checksum = createHash("sha256").update(bytes).digest("hex");
    const storageKey = `${id}/${num.display}.pdf`;
    await client.query(
      `update nda_documents
       set pdf_bytes = $2,
           storage_key = $3,
           byte_size = $4,
           checksum_sha256 = $5,
           updated_at = now()
       where id = $1`,
      [id, bytes, storageKey, bytes.length, checksum]
    );

    await writeAudit({
      action: "NDA_CREATED",
      actorUserId: opts.actorUserId,
      resourceType: "nda",
      resourceId: id,
      context: { number: num.display },
    });

    return { id, numberDisplay: num.display };
  });
}

export async function loadNdaPdf(id: string): Promise<{
  bytes: Buffer;
  numberDisplay: string;
  contentType: string;
} | null> {
  const result = await adminQuery<{
    number_display: string;
    content_type: string;
    pdf_bytes: Buffer | null;
  }>(
    `select number_display, content_type, pdf_bytes from nda_documents where id = $1`,
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
