import Link from "next/link";
import { listContracts } from "@/lib/super-admin/contracts/service";

export const dynamic = "force-dynamic";

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Rascunho",
  ISSUED: "Emitido",
  SIGNED: "Assinado",
  CANCELLED: "Cancelado",
};

export default async function ContractsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q : undefined;
  const page = Number(typeof sp.page === "string" ? sp.page : 1);
  const data = await listContracts({ q, page, pageSize: 25 });

  return (
    <div className="sa-page">
      <div className="sa-page-head">
        <div>
          <h1>Contratos</h1>
          <p className="muted">{data.total} documento(s)</p>
        </div>
        <Link
          className="btn btn-primary"
          href="/pt-br/super-admin/contracts/new"
        >
          Novo contrato
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
              <th>Status</th>
              <th>Total</th>
              <th>Data</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((c) => (
              <tr key={c.id}>
                <td>
                  <Link href={`/pt-br/super-admin/contracts/${c.id}`}>
                    {c.number_display}
                  </Link>
                </td>
                <td>{c.client_legal_name}</td>
                <td>{c.project_name}</td>
                <td>
                  <span className="sa-pill">
                    {STATUS_LABELS[c.status] || c.status}
                  </span>
                </td>
                <td>
                  {c.currency} {c.total}
                </td>
                <td>{c.signed_on}</td>
              </tr>
            ))}
            {data.items.length === 0 && (
              <tr>
                <td colSpan={6} className="muted">
                  Nenhum contrato gerado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
