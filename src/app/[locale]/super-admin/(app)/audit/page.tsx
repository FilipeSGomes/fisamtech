import Link from "next/link";
import { listAuditLogs } from "@/lib/super-admin/audit/list";

export const dynamic = "force-dynamic";

export default async function AuditPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q : undefined;
  const action = typeof sp.action === "string" ? sp.action : undefined;
  const page = Number(typeof sp.page === "string" ? sp.page : 1);
  const data = await listAuditLogs({ q, action, page, pageSize: 50 });

  return (
    <div className="sa-page">
      <h1>Auditoria</h1>
      <p className="muted">{data.total} evento(s)</p>

      <form className="sa-filters" method="get">
        <input name="q" placeholder="Ação / recurso / ator" defaultValue={q || ""} />
        <input name="action" placeholder="Ação exata" defaultValue={action || ""} />
        <button className="btn btn-primary" type="submit">
          Filtrar
        </button>
      </form>

      <div className="sa-table-wrap">
        <table className="sa-table">
          <thead>
            <tr>
              <th>Quando</th>
              <th>Ação</th>
              <th>Ator</th>
              <th>Recurso</th>
              <th>Resultado</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((row) => (
              <tr key={row.id}>
                <td>{new Date(row.created_at).toLocaleString("pt-BR")}</td>
                <td>
                  <code>{row.action}</code>
                </td>
                <td>{row.actor_name || "—"}</td>
                <td>
                  {row.resource_type || "—"}
                  {row.resource_id ? (
                    <div className="muted sa-mono">{row.resource_id}</div>
                  ) : null}
                </td>
                <td>{row.result}</td>
              </tr>
            ))}
            {data.items.length === 0 && (
              <tr>
                <td colSpan={5} className="muted">
                  Sem eventos.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="sa-pagination">
        {page > 1 && (
          <Link href={`/pt-br/super-admin/audit?page=${page - 1}${q ? `&q=${q}` : ""}`}>
            Anterior
          </Link>
        )}
        <span>Página {data.page}</span>
        {data.page * data.pageSize < data.total && (
          <Link href={`/pt-br/super-admin/audit?page=${page + 1}${q ? `&q=${q}` : ""}`}>
            Próxima
          </Link>
        )}
      </div>
    </div>
  );
}
