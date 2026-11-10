import Link from "next/link";
import {
  listProposals,
} from "@/lib/super-admin/proposals/service";
import {
  PROPOSAL_STATUS_LABELS,
  PROPOSAL_STATUSES,
  type ProposalStatus,
} from "@/lib/super-admin/proposals/workflow";

export const dynamic = "force-dynamic";

export default async function ProposalsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q : undefined;
  const status = typeof sp.status === "string" ? sp.status : undefined;
  const page = Number(typeof sp.page === "string" ? sp.page : 1);
  const data = await listProposals({ q, status, page, pageSize: 25 });

  return (
    <div className="sa-page">
      <div className="sa-page-head">
        <div>
          <h1>Propostas</h1>
          <p className="muted">{data.total} registro(s)</p>
        </div>
        <Link className="btn btn-primary" href="/pt-br/super-admin/proposals/new">
          Nova proposta
        </Link>
      </div>

      <form className="sa-filters" method="get">
        <input name="q" placeholder="Número / título / empresa" defaultValue={q || ""} />
        <select name="status" defaultValue={status || ""}>
          <option value="">Todos os status</option>
          {PROPOSAL_STATUSES.map((s) => (
            <option key={s} value={s}>
              {PROPOSAL_STATUS_LABELS[s]}
            </option>
          ))}
        </select>
        <button className="btn btn-primary" type="submit">
          Filtrar
        </button>
      </form>

      <div className="sa-table-wrap">
        <table className="sa-table">
          <thead>
            <tr>
              <th>Número</th>
              <th>Título</th>
              <th>Cliente</th>
              <th>Status</th>
              <th>Total</th>
              <th>Versão</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((p) => (
              <tr key={p.id}>
                <td>
                  <Link href={`/pt-br/super-admin/proposals/${p.id}`}>
                    {p.number_display}
                  </Link>
                </td>
                <td>{p.title}</td>
                <td>{p.company_name || "—"}</td>
                <td>
                  <span className="sa-pill">
                    {PROPOSAL_STATUS_LABELS[p.status as ProposalStatus] || p.status}
                  </span>
                </td>
                <td>
                  {p.total ? `${p.currency} ${p.total}` : "—"}
                </td>
                <td>v{p.current_version}</td>
              </tr>
            ))}
            {data.items.length === 0 && (
              <tr>
                <td colSpan={6} className="muted">
                  Nenhuma proposta.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
