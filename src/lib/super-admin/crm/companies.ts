import { adminQuery } from "@/lib/db";
import { writeAudit } from "@/lib/super-admin/audit/write";

export type CompanyRow = {
  id: string;
  created_at: Date;
  updated_at: Date;
  legal_name: string;
  trade_name: string | null;
  tax_id: string | null;
  tax_id_normalized: string | null;
  country: string | null;
  website: string | null;
  notes: string | null;
  created_by: string | null;
};

function normalizeTaxId(taxId?: string | null): string | null {
  if (!taxId) return null;
  const digits = taxId.replace(/\D/g, "");
  return digits || null;
}

export async function listCompanies(opts: {
  q?: string;
  page?: number;
  pageSize?: number;
}): Promise<{ items: CompanyRow[]; total: number; page: number; pageSize: number }> {
  const page = Math.max(1, opts.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, opts.pageSize ?? 20));
  const clauses: string[] = [];
  const values: unknown[] = [];
  if (opts.q) {
    values.push(`%${opts.q}%`);
    const i = values.length;
    clauses.push(
      `(legal_name ilike $${i} or coalesce(trade_name,'') ilike $${i} or coalesce(tax_id,'') ilike $${i})`
    );
  }
  const whereSql = clauses.length ? `where ${clauses.join(" and ")}` : "";
  const totalResult = await adminQuery<{ n: number }>(
    `select count(*)::int as n from companies ${whereSql}`,
    values
  );
  const total = totalResult.rows[0]?.n ?? 0;
  const offset = (page - 1) * pageSize;
  values.push(pageSize, offset);
  const items = await adminQuery<CompanyRow>(
    `select * from companies ${whereSql}
     order by legal_name asc
     limit $${values.length - 1} offset $${values.length}`,
    values
  );
  return { items: items.rows, total, page, pageSize };
}

export async function getCompany(id: string): Promise<CompanyRow | null> {
  const result = await adminQuery<CompanyRow>(
    `select * from companies where id = $1`,
    [id]
  );
  return result.rows[0] ?? null;
}

export async function createCompany(opts: {
  legalName: string;
  tradeName?: string | null;
  taxId?: string | null;
  country?: string | null;
  website?: string | null;
  notes?: string | null;
  actorUserId: string;
}): Promise<string> {
  const result = await adminQuery<{ id: string }>(
    `insert into companies (
       legal_name, trade_name, tax_id, tax_id_normalized, country, website, notes, created_by
     ) values ($1,$2,$3,$4,$5,$6,$7,$8)
     returning id`,
    [
      opts.legalName.trim(),
      opts.tradeName?.trim() || null,
      opts.taxId?.trim() || null,
      normalizeTaxId(opts.taxId),
      opts.country?.trim() || null,
      opts.website?.trim() || null,
      opts.notes?.trim() || null,
      opts.actorUserId,
    ]
  );
  const id = result.rows[0].id;
  await writeAudit({
    action: "COMPANY_CREATED",
    actorUserId: opts.actorUserId,
    resourceType: "company",
    resourceId: id,
  });
  return id;
}

export async function updateCompany(opts: {
  id: string;
  legalName?: string;
  tradeName?: string | null;
  taxId?: string | null;
  country?: string | null;
  website?: string | null;
  notes?: string | null;
  actorUserId: string;
}): Promise<void> {
  const current = await getCompany(opts.id);
  if (!current) throw new Error("Empresa não encontrada");
  await adminQuery(
    `update companies set
       legal_name = coalesce($2, legal_name),
       trade_name = case when $3::boolean then $4 else trade_name end,
       tax_id = case when $5::boolean then $6 else tax_id end,
       tax_id_normalized = case when $5::boolean then $7 else tax_id_normalized end,
       country = case when $8::boolean then $9 else country end,
       website = case when $10::boolean then $11 else website end,
       notes = case when $12::boolean then $13 else notes end,
       updated_at = now()
     where id = $1`,
    [
      opts.id,
      opts.legalName?.trim() ?? null,
      opts.tradeName !== undefined,
      opts.tradeName?.trim() || null,
      opts.taxId !== undefined,
      opts.taxId?.trim() || null,
      normalizeTaxId(opts.taxId),
      opts.country !== undefined,
      opts.country?.trim() || null,
      opts.website !== undefined,
      opts.website?.trim() || null,
      opts.notes !== undefined,
      opts.notes?.trim() || null,
    ]
  );
  await writeAudit({
    action: "COMPANY_UPDATED",
    actorUserId: opts.actorUserId,
    resourceType: "company",
    resourceId: opts.id,
  });
}

export async function findOrCreateCompanyByName(opts: {
  name: string;
  country?: string | null;
  actorUserId: string;
}): Promise<string> {
  const name = opts.name.trim();
  if (!name) throw new Error("Nome da empresa obrigatório");
  const existing = await adminQuery<{ id: string }>(
    `select id from companies where lower(legal_name) = lower($1) limit 1`,
    [name]
  );
  if (existing.rows[0]) return existing.rows[0].id;
  return createCompany({
    legalName: name,
    country: opts.country,
    actorUserId: opts.actorUserId,
  });
}
