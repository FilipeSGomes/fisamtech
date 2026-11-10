import { adminQuery } from "@/lib/db";

export type AuditRow = {
  id: string;
  created_at: Date;
  actor_user_id: string | null;
  actor_name: string | null;
  action: string;
  resource_type: string | null;
  resource_id: string | null;
  result: string;
  correlation_id: string | null;
  ip: string | null;
  context: Record<string, unknown>;
};

export async function listAuditLogs(opts: {
  q?: string;
  action?: string;
  page?: number;
  pageSize?: number;
}): Promise<{ items: AuditRow[]; total: number; page: number; pageSize: number }> {
  const page = Math.max(1, opts.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, opts.pageSize ?? 50));
  const clauses: string[] = [];
  const values: unknown[] = [];
  if (opts.q) {
    values.push(`%${opts.q}%`);
    const i = values.length;
    clauses.push(
      `(a.action ilike $${i} or coalesce(a.resource_type,'') ilike $${i} or coalesce(a.resource_id,'') ilike $${i} or coalesce(u.name,'') ilike $${i})`
    );
  }
  if (opts.action) {
    values.push(opts.action);
    clauses.push(`a.action = $${values.length}`);
  }
  const whereSql = clauses.length ? `where ${clauses.join(" and ")}` : "";
  const totalResult = await adminQuery<{ n: number }>(
    `select count(*)::int as n
     from admin_audit_logs a
     left join admin_users u on u.id = a.actor_user_id
     ${whereSql}`,
    values
  );
  const total = totalResult.rows[0]?.n ?? 0;
  const offset = (page - 1) * pageSize;
  values.push(pageSize, offset);
  const items = await adminQuery<AuditRow>(
    `select a.id, a.created_at, a.actor_user_id, u.name as actor_name,
            a.action, a.resource_type, a.resource_id, a.result,
            a.correlation_id, a.ip, a.context
     from admin_audit_logs a
     left join admin_users u on u.id = a.actor_user_id
     ${whereSql}
     order by a.created_at desc
     limit $${values.length - 1} offset $${values.length}`,
    values
  );
  return { items: items.rows, total, page, pageSize };
}
