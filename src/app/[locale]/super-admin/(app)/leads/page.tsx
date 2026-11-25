import Link from "next/link";
import { LeadRowActions } from "@/components/super-admin/LeadRowActions";
import { hasPermission } from "@/lib/super-admin/rbac/authorize";
import { requireAdminPage } from "@/lib/super-admin/rbac/page-gate";
import { listLeads, LEAD_STATUS_LABELS, type LeadStatus } from "@/lib/super-admin/crm/leads";

export const dynamic = "force-dynamic";

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await requireAdminPage("leads:read");
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q : undefined;
  const status = typeof sp.status === "string" ? sp.status : undefined;
  const visibility = sp.visibility === "archived" || sp.visibility === "all" ? sp.visibility : "active";
  const page = Number(typeof sp.page === "string" ? sp.page : 1);
  const data = await listLeads({ q, status, visibility, page, pageSize: 25 });
  const canDelete = hasPermission(session, "leads:delete");

  return (
    <div className="sa-page">
      <div className="sa-page-head">
        <div>
          <h1>Leads</h1>
          <p className="muted">{data.total} registro(s)</p>
        </div>
      </div>

      <form className="sa-filters" method="get">
        <input name="q" placeholder="Buscar nome, e-mail, empresa" defaultValue={q || ""} />
        <select name="status" defaultValue={status || ""}>
          <option value="">Todos os status</option>
          {Object.entries(LEAD_STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <select name="visibility" defaultValue={visibility}>
          <option value="active">Ativos</option>
          <option value="archived">Desativados</option>
          <option value="all">Todos</option>
        </select>
        <button className="btn btn-primary" type="submit">
          Filtrar
        </button>
      </form>

      {data.items.length === 0 ? (
        <p className="muted">Nenhum lead encontrado.</p>
      ) : (
        <div className="sa-table-wrap">
          <table className="sa-table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Empresa</th>
                <th>Status</th>
                <th>Origem</th>
                <th>Responsável</th>
                <th>Criado</th>
                {canDelete ? <th>Ações</th> : null}
              </tr>
            </thead>
            <tbody>
              {data.items.map((lead) => (
                <tr key={lead.id}>
                  <td>
                    <Link href={`/pt-br/super-admin/leads/${lead.id}`}>
                      {lead.name}
                    </Link>
                    <div className="muted">{lead.email}</div>
                  </td>
                  <td>{lead.company || "—"}</td>
                  <td>
                    <span className="sa-pill">
                      {LEAD_STATUS_LABELS[lead.status as LeadStatus] || lead.status}
                    </span>
                    {lead.archived_at ? <div className="muted">Desativado</div> : null}
                  </td>
                  <td>{lead.source}</td>
                  <td>{lead.owner_name || "—"}</td>
                  <td>{new Date(lead.created_at).toLocaleString("pt-BR")}</td>
                  {canDelete ? (
                    <td>
                      <LeadRowActions leadId={lead.id} archived={Boolean(lead.archived_at)} canDelete={canDelete} />
                    </td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="sa-pagination">
        {page > 1 && (
          <Link href={`/pt-br/super-admin/leads?page=${page - 1}${q ? `&q=${q}` : ""}${status ? `&status=${status}` : ""}&visibility=${visibility}`}>
            Anterior
          </Link>
        )}
        <span>
          Página {data.page}
        </span>
        {data.page * data.pageSize < data.total && (
          <Link href={`/pt-br/super-admin/leads?page=${page + 1}${q ? `&q=${q}` : ""}${status ? `&status=${status}` : ""}&visibility=${visibility}`}>
            Próxima
          </Link>
        )}
      </div>
    </div>
  );
}
