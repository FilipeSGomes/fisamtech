import { adminQuery } from "@/lib/db";
import { writeAudit } from "@/lib/super-admin/audit/write";
import { normalizeEmail } from "@/lib/super-admin/auth/password";

export type ContactRow = {
  id: string;
  created_at: Date;
  updated_at: Date;
  company_id: string | null;
  company_name: string | null;
  name: string;
  email: string | null;
  email_normalized: string | null;
  phone: string | null;
  phone_normalized: string | null;
  role_title: string | null;
  notes: string | null;
  created_by: string | null;
};

function normalizePhone(phone?: string | null): string | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, "");
  return digits || null;
}

export async function listContacts(opts: {
  q?: string;
  companyId?: string;
  page?: number;
  pageSize?: number;
}): Promise<{ items: ContactRow[]; total: number; page: number; pageSize: number }> {
  const page = Math.max(1, opts.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, opts.pageSize ?? 20));
  const clauses: string[] = [];
  const values: unknown[] = [];
  if (opts.q) {
    values.push(`%${opts.q}%`);
    const i = values.length;
    clauses.push(
      `(c.name ilike $${i} or coalesce(c.email,'') ilike $${i} or coalesce(c.phone,'') ilike $${i})`
    );
  }
  if (opts.companyId) {
    values.push(opts.companyId);
    clauses.push(`c.company_id = $${values.length}`);
  }
  const whereSql = clauses.length ? `where ${clauses.join(" and ")}` : "";
  const totalResult = await adminQuery<{ n: number }>(
    `select count(*)::int as n from contacts c ${whereSql}`,
    values
  );
  const total = totalResult.rows[0]?.n ?? 0;
  const offset = (page - 1) * pageSize;
  values.push(pageSize, offset);
  const items = await adminQuery<ContactRow>(
    `select c.*, co.legal_name as company_name
     from contacts c
     left join companies co on co.id = c.company_id
     ${whereSql}
     order by c.name asc
     limit $${values.length - 1} offset $${values.length}`,
    values
  );
  return { items: items.rows, total, page, pageSize };
}

export async function getContact(id: string): Promise<ContactRow | null> {
  const result = await adminQuery<ContactRow>(
    `select c.*, co.legal_name as company_name
     from contacts c
     left join companies co on co.id = c.company_id
     where c.id = $1`,
    [id]
  );
  return result.rows[0] ?? null;
}

export async function createContact(opts: {
  name: string;
  email?: string | null;
  phone?: string | null;
  roleTitle?: string | null;
  companyId?: string | null;
  notes?: string | null;
  actorUserId: string;
}): Promise<string> {
  const result = await adminQuery<{ id: string }>(
    `insert into contacts (
       company_id, name, email, email_normalized, phone, phone_normalized,
       role_title, notes, created_by
     ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9)
     returning id`,
    [
      opts.companyId ?? null,
      opts.name.trim(),
      opts.email?.trim() || null,
      opts.email ? normalizeEmail(opts.email) : null,
      opts.phone?.trim() || null,
      normalizePhone(opts.phone),
      opts.roleTitle?.trim() || null,
      opts.notes?.trim() || null,
      opts.actorUserId,
    ]
  );
  const id = result.rows[0].id;
  await writeAudit({
    action: "CONTACT_CREATED",
    actorUserId: opts.actorUserId,
    resourceType: "contact",
    resourceId: id,
  });
  return id;
}

export async function updateContact(opts: {
  id: string;
  name?: string;
  email?: string | null;
  phone?: string | null;
  roleTitle?: string | null;
  companyId?: string | null;
  notes?: string | null;
  actorUserId: string;
}): Promise<void> {
  const current = await getContact(opts.id);
  if (!current) throw new Error("Contato não encontrado");
  await adminQuery(
    `update contacts set
       name = coalesce($2, name),
       email = case when $3::boolean then $4 else email end,
       email_normalized = case when $3::boolean then $5 else email_normalized end,
       phone = case when $6::boolean then $7 else phone end,
       phone_normalized = case when $6::boolean then $8 else phone_normalized end,
       role_title = case when $9::boolean then $10 else role_title end,
       company_id = case when $11::boolean then $12 else company_id end,
       notes = case when $13::boolean then $14 else notes end,
       updated_at = now()
     where id = $1`,
    [
      opts.id,
      opts.name?.trim() ?? null,
      opts.email !== undefined,
      opts.email?.trim() || null,
      opts.email ? normalizeEmail(opts.email) : null,
      opts.phone !== undefined,
      opts.phone?.trim() || null,
      normalizePhone(opts.phone),
      opts.roleTitle !== undefined,
      opts.roleTitle?.trim() || null,
      opts.companyId !== undefined,
      opts.companyId,
      opts.notes !== undefined,
      opts.notes?.trim() || null,
    ]
  );
  await writeAudit({
    action: "CONTACT_UPDATED",
    actorUserId: opts.actorUserId,
    resourceType: "contact",
    resourceId: opts.id,
  });
}

export async function findOrCreateContact(opts: {
  name: string;
  email?: string | null;
  phone?: string | null;
  roleTitle?: string | null;
  companyId?: string | null;
  actorUserId: string;
}): Promise<string> {
  if (opts.email) {
    const existing = await adminQuery<{ id: string }>(
      `select id from contacts where email_normalized = $1 limit 1`,
      [normalizeEmail(opts.email)]
    );
    if (existing.rows[0]) return existing.rows[0].id;
  }
  return createContact(opts);
}
