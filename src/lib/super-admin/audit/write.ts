import { adminQuery } from "@/lib/db";

export type AuditInput = {
  action: string;
  actorUserId?: string | null;
  resourceType?: string | null;
  resourceId?: string | null;
  result?: "success" | "failure" | "denied";
  correlationId?: string | null;
  ip?: string | null;
  userAgent?: string | null;
  context?: Record<string, unknown>;
};

export async function writeAudit(input: AuditInput): Promise<void> {
  try {
    await adminQuery(
      `insert into admin_audit_logs
        (actor_user_id, action, resource_type, resource_id, result, correlation_id, ip, user_agent, context)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb)`,
      [
        input.actorUserId ?? null,
        input.action,
        input.resourceType ?? null,
        input.resourceId ?? null,
        input.result ?? "success",
        input.correlationId ?? null,
        input.ip ?? null,
        input.userAgent ?? null,
        JSON.stringify(input.context ?? {}),
      ]
    );
  } catch (error) {
    console.error("[audit] failed to write", error);
  }
}
