import Link from "next/link";
import { OpportunityForm } from "@/components/super-admin/OpportunityForm";
import { listCompanies } from "@/lib/super-admin/crm/companies";
import { listContacts } from "@/lib/super-admin/crm/contacts";
import {
  listOpportunities,
  OPP_STAGE_LABELS,
  OPP_STAGES,
  type OppStage,
} from "@/lib/super-admin/crm/opportunities";

export const dynamic = "force-dynamic";

export default async function OpportunitiesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q : undefined;
  const status = typeof sp.status === "string" ? sp.status : undefined;
  const stage = typeof sp.stage === "string" ? sp.stage : undefined;
  const page = Number(typeof sp.page === "string" ? sp.page : 1);

  const [data, companies, contacts] = await Promise.all([
    listOpportunities({ q, status, stage, page, pageSize: 25 }),
    listCompanies({ pageSize: 200 }),
    listContacts({ pageSize: 200 }),
  ]);

  return (
    <div className="sa-page">
      <div className="sa-page-head">
        <div>
          <h1>Oportunidades</h1>
          <p className="muted">{data.total} registro(s)</p>
        </div>
      </div>

      <form className="sa-filters" method="get">
        <input name="q" placeholder="Buscar título / empresa" defaultValue={q || ""} />
        <select name="status" defaultValue={status || ""}>
          <option value="">Todos os status</option>
          <option value="OPEN">Aberta</option>
          <option value="WON">Ganha</option>
          <option value="LOST">Perdida</option>
          <option value="CANCELLED">Cancelada</option>
        </select>
        <select name="stage" defaultValue={stage || ""}>
          <option value="">Todos os estágios</option>
          {OPP_STAGES.map((s) => (
            <option key={s} value={s}>
              {OPP_STAGE_LABELS[s]}
            </option>
          ))}
        </select>
        <button className="btn btn-primary" type="submit">
          Filtrar
        </button>
      </form>

      <div className="sa-panels">
        <div className="sa-table-wrap">
          <table className="sa-table">
            <thead>
              <tr>
                <th>Título</th>
                <th>Empresa</th>
                <th>Estágio</th>
                <th>Valor</th>
                <th>Owner</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((o) => (
                <tr key={o.id}>
                  <td>
                    <strong>{o.title}</strong>
                    <div className="muted">{o.status}</div>
                  </td>
                  <td>{o.company_name || "—"}</td>
                  <td>
                    <span className="sa-pill">
                      {OPP_STAGE_LABELS[o.stage as OppStage] || o.stage}
                    </span>
                  </td>
                  <td>
                    {o.estimated_value
                      ? `${o.currency} ${o.estimated_value}`
                      : "—"}
                  </td>
                  <td>{o.owner_name || "—"}</td>
                </tr>
              ))}
              {data.items.length === 0 && (
                <tr>
                  <td colSpan={5} className="muted">
                    Nenhuma oportunidade.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <OpportunityForm
          companies={companies.items.map((c) => ({
            id: c.id,
            legal_name: c.legal_name,
          }))}
          contacts={contacts.items.map((c) => ({ id: c.id, name: c.name }))}
        />
      </div>

      <div className="sa-pagination">
        {page > 1 && <Link href={`/pt-br/super-admin/opportunities?page=${page - 1}`}>Anterior</Link>}
        <span>Página {data.page}</span>
        {data.page * data.pageSize < data.total && (
          <Link href={`/pt-br/super-admin/opportunities?page=${page + 1}`}>Próxima</Link>
        )}
      </div>
    </div>
  );
}
