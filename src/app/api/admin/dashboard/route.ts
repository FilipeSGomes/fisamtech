import { NextRequest, NextResponse } from "next/server";
import { adminQuery } from "@/lib/db";
import { jsonError, requireAdminApi } from "@/lib/super-admin/http";

export async function GET(req: NextRequest) {
  try {
    await requireAdminApi(req, "dashboard:read");

    const [leadsByStatus, leadsBySource, openOpps, proposals, stale] =
      await Promise.all([
        adminQuery<{ status: string; n: number }>(
          `select status, count(*)::int as n from leads group by status order by status`
        ),
        adminQuery<{ source: string; n: number }>(
          `select source, count(*)::int as n from leads group by source order by n desc`
        ),
        adminQuery<{ n: number; pipeline: string }>(
          `select count(*)::int as n,
                  coalesce(sum(estimated_value),0)::text as pipeline
           from opportunities where status = 'OPEN'`
        ),
        adminQuery<{ status: string; n: number }>(
          `select status, count(*)::int as n from proposals group by status`
        ),
        adminQuery<{ n: number }>(
          `select count(*)::int as n from leads
           where status not in ('WON','LOST')
             and (next_action_at is null or next_action_at < now())`
        ),
      ]);

    const newLeads = leadsByStatus.rows.find((r) => r.status === "NEW")?.n ?? 0;
    const qualified =
      leadsByStatus.rows.find((r) => r.status === "QUALIFIED")?.n ?? 0;

    return NextResponse.json({
      period: "all_time",
      kpis: {
        newLeads,
        qualifiedLeads: qualified,
        openOpportunities: openOpps.rows[0]?.n ?? 0,
        pipelineValue: openOpps.rows[0]?.pipeline ?? "0",
        proposalsIssued: proposals.rows
          .filter((r) =>
            ["SENT", "VIEWED", "ACCEPTED", "REJECTED", "APPROVED"].includes(
              r.status
            )
          )
          .reduce((a, b) => a + b.n, 0),
        proposalsAccepted:
          proposals.rows.find((r) => r.status === "ACCEPTED")?.n ?? 0,
        staleLeads: stale.rows[0]?.n ?? 0,
      },
      leadsByStatus: leadsByStatus.rows,
      leadsBySource: leadsBySource.rows,
      proposalsByStatus: proposals.rows,
    });
  } catch (error) {
    return jsonError(error);
  }
}
