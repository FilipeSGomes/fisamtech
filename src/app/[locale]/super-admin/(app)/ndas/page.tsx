import Link from "next/link";
import { listNdas } from "@/lib/super-admin/nda/service";

export const dynamic = "force-dynamic";

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Rascunho",
  ISSUED: "Emitido",
  SIGNED: "Assinado",
  CANCELLED: "Cancelado",
};

export default async function NdasPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q : undefined;
  const page = Number(typeof sp.page === "string" ? sp.page : 1);
  const data = await listNdas({ q, page, pageSize: 25 });

  return (
    <div className="sa-page">
      <div className="sa-page-head">
        <div>
          <h1>NDAs</h1>
          <p className="muted">{data.total} documento(s)</p>
        </div>
        <Link className="btn btn-primary" href="/pt-br/super-admin/ndas/new">
          Novo NDA unilateral
        </Link>
      </div>

      <form className="sa-filters" method="get">
        <input
          name="q"
          placeholder="Número / cliente / projeto"
          defaultValue={q || ""}
        />
        <button className="btn btn-primary" type="submit">
          Filtrar
        </button>
      </form>

      <div className="sa-table-wrap">
        <table className="sa-table">
          <thead>
            <tr>
              <th>Número</th>
              <th>Cliente</th>
              <th>Projeto</th>
              <th>Representante</th>
              <th>Status</th>
              <th>Data</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((n) => (
              <tr key={n.id}>
                <td>
                  <Link href={`/pt-br/super-admin/ndas/${n.id}`}>
                    {n.number_display}
                  </Link>
                </td>
                <td>{n.client_legal_name}</td>
                <td>{n.project_name}</td>
                <td>{n.client_rep_name}</td>
                <td>
                  <span className="sa-pill">
                    {STATUS_LABELS[n.status] || n.status}
                  </span>
                </td>
                <td>{n.signed_on}</td>
              </tr>
            ))}
            {data.items.length === 0 && (
              <tr>
                <td colSpan={6} className="muted">
                  Nenhum NDA gerado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
