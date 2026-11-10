import Link from "next/link";
import { notFound } from "next/navigation";
import { LeadConvertButton } from "@/components/super-admin/LeadConvertButton";
import { LeadDetailClient } from "@/components/super-admin/LeadDetailClient";
import {
  LEAD_STATUS_LABELS,
  findDuplicateLeads,
  getLead,
  listLeadActivities,
  type LeadStatus,
} from "@/lib/super-admin/crm/leads";

export const dynamic = "force-dynamic";

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const lead = await getLead(id);
  if (!lead) notFound();

  const [activities, duplicates] = await Promise.all([
    listLeadActivities(id),
    findDuplicateLeads(lead.email),
  ]);

  return (
    <div className="sa-page">
      <p>
        <Link href="/pt-br/super-admin/leads">← Leads</Link>
      </p>
      <h1>{lead.name}</h1>
      <p className="muted">
        {LEAD_STATUS_LABELS[lead.status as LeadStatus]} · {lead.source} ·{" "}
        {lead.email}
      </p>

      <div className="sa-panels">
        <section className="sa-panel">
          <h2>Dados</h2>
          <dl className="sa-dl">
            <div>
              <dt>Empresa</dt>
              <dd>{lead.company || "—"}</dd>
            </div>
            <div>
              <dt>Cargo</dt>
              <dd>{lead.role || "—"}</dd>
            </div>
            <div>
              <dt>Telefone</dt>
              <dd>{lead.phone || "—"}</dd>
            </div>
            <div>
              <dt>País / Moeda</dt>
              <dd>
                {lead.country || "—"} / {lead.currency}
              </dd>
            </div>
            <div>
              <dt>Orçamento</dt>
              <dd>{lead.budget_range || "—"}</dd>
            </div>
            <div>
              <dt>Responsável</dt>
              <dd>{lead.owner_name || "—"}</dd>
            </div>
            <div>
              <dt>Desafio</dt>
              <dd>{lead.challenge || "—"}</dd>
            </div>
          </dl>
        </section>

        <div>
          <LeadDetailClient leadId={lead.id} status={lead.status as LeadStatus} />
          <div style={{ marginTop: 16 }}>
            <LeadConvertButton leadId={lead.id} />
          </div>
        </div>
      </div>

      <section className="sa-panel" style={{ marginTop: 24 }}>
        <h2>Possíveis duplicidades</h2>
        {duplicates.filter((d) => d.id !== lead.id).length === 0 ? (
          <p className="muted">Nenhuma duplicidade por e-mail.</p>
        ) : (
          <ul className="sa-list">
            {duplicates
              .filter((d) => d.id !== lead.id)
              .map((d) => (
                <li key={d.id}>
                  <Link href={`/pt-br/super-admin/leads/${d.id}`}>{d.name}</Link>
                  <span className="muted">
                    {d.status} · {new Date(d.created_at).toLocaleDateString("pt-BR")}
                  </span>
                </li>
              ))}
          </ul>
        )}
      </section>

      <section className="sa-panel" style={{ marginTop: 24 }}>
        <h2>Histórico</h2>
        {activities.length === 0 ? (
          <p className="muted">Sem atividades registradas.</p>
        ) : (
          <ol className="sa-timeline">
            {activities.map((a) => (
              <li key={a.id}>
                <div className="sa-timeline-meta">
                  {new Date(a.created_at).toLocaleString("pt-BR")} · {a.activity_type}
                  {a.actor_name ? ` · ${a.actor_name}` : ""}
                </div>
                <strong>{a.subject || "Atividade"}</strong>
                {a.body ? <p>{a.body}</p> : null}
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}
