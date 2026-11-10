import { adminQuery } from "@/lib/db";
import { LEAD_STATUS_LABELS, type LeadStatus } from "@/lib/super-admin/crm/leads";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [byStatus, bySource, openOpps, proposals, totalLeads] = await Promise.all([
    adminQuery<{ status: string; n: number }>(
      `select status, count(*)::int as n from leads group by status`
    ),
    adminQuery<{ source: string; n: number }>(
      `select source, count(*)::int as n from leads group by source order by n desc`
    ),
    adminQuery<{ n: number; pipeline: string }>(
      `select count(*)::int as n, coalesce(sum(estimated_value),0)::text as pipeline
       from opportunities where status = 'OPEN'`
    ),
    adminQuery<{ n: number }>(`select count(*)::int as n from proposals`),
    adminQuery<{ n: number }>(`select count(*)::int as n from leads`),
  ]);

  const newLeads = byStatus.rows.find((r) => r.status === "NEW")?.n ?? 0;
  const qualified = byStatus.rows.find((r) => r.status === "QUALIFIED")?.n ?? 0;

  return (
    <div className="sa-page">
      <h1>Dashboard</h1>
      <p className="muted">Indicadores operacionais (dados reais do banco).</p>
      <div className="sa-kpi-grid">
        <div className="sa-kpi">
          <span className="sa-kpi-label">Leads totais</span>
          <strong className="sa-kpi-value">{totalLeads.rows[0]?.n ?? 0}</strong>
        </div>
        <div className="sa-kpi">
          <span className="sa-kpi-label">Leads novos</span>
          <strong className="sa-kpi-value">{newLeads}</strong>
        </div>
        <div className="sa-kpi">
          <span className="sa-kpi-label">Qualificados</span>
          <strong className="sa-kpi-value">{qualified}</strong>
        </div>
        <div className="sa-kpi">
          <span className="sa-kpi-label">Oportunidades abertas</span>
          <strong className="sa-kpi-value">{openOpps.rows[0]?.n ?? 0}</strong>
        </div>
        <div className="sa-kpi">
          <span className="sa-kpi-label">Pipeline (estimado)</span>
          <strong className="sa-kpi-value">{openOpps.rows[0]?.pipeline ?? "0"}</strong>
        </div>
        <div className="sa-kpi">
          <span className="sa-kpi-label">Propostas</span>
          <strong className="sa-kpi-value">{proposals.rows[0]?.n ?? 0}</strong>
        </div>
      </div>

      <div className="sa-panels">
        <section className="sa-panel">
          <h2>Leads por status</h2>
          {byStatus.rows.length === 0 ? (
            <p className="muted">Sem leads ainda.</p>
          ) : (
            <ul className="sa-list">
              {byStatus.rows.map((row) => (
                <li key={row.status}>
                  <span>
                    {LEAD_STATUS_LABELS[row.status as LeadStatus] || row.status}
                  </span>
                  <strong>{row.n}</strong>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section className="sa-panel">
          <h2>Leads por origem</h2>
          {bySource.rows.length === 0 ? (
            <p className="muted">Sem dados.</p>
          ) : (
            <ul className="sa-list">
              {bySource.rows.map((row) => (
                <li key={row.source}>
                  <span>{row.source}</span>
                  <strong>{row.n}</strong>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
