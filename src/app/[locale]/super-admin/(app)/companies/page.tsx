import Link from "next/link";
import { CompanyForm } from "@/components/super-admin/CompanyForm";
import { listCompanies } from "@/lib/super-admin/crm/companies";

export const dynamic = "force-dynamic";

export default async function CompaniesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q : undefined;
  const page = Number(typeof sp.page === "string" ? sp.page : 1);
  const data = await listCompanies({ q, page, pageSize: 25 });

  return (
    <div className="sa-page">
      <div className="sa-page-head">
        <div>
          <h1>Empresas</h1>
          <p className="muted">{data.total} registro(s)</p>
        </div>
      </div>

      <form className="sa-filters" method="get">
        <input name="q" placeholder="Buscar empresa / CNPJ" defaultValue={q || ""} />
        <button className="btn btn-primary" type="submit">
          Filtrar
        </button>
      </form>

      <div className="sa-panels">
        <div className="sa-table-wrap">
          <table className="sa-table">
            <thead>
              <tr>
                <th>Razão social</th>
                <th>CNPJ</th>
                <th>País</th>
                <th>Atualizado</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((c) => (
                <tr key={c.id}>
                  <td>
                    <strong>{c.legal_name}</strong>
                    {c.trade_name ? <div className="muted">{c.trade_name}</div> : null}
                  </td>
                  <td>{c.tax_id || "—"}</td>
                  <td>{c.country || "—"}</td>
                  <td>{new Date(c.updated_at).toLocaleString("pt-BR")}</td>
                </tr>
              ))}
              {data.items.length === 0 && (
                <tr>
                  <td colSpan={4} className="muted">
                    Nenhuma empresa.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <CompanyForm />
      </div>

      <div className="sa-pagination">
        {page > 1 && (
          <Link href={`/pt-br/super-admin/companies?page=${page - 1}${q ? `&q=${q}` : ""}`}>
            Anterior
          </Link>
        )}
        <span>Página {data.page}</span>
        {data.page * data.pageSize < data.total && (
          <Link href={`/pt-br/super-admin/companies?page=${page + 1}${q ? `&q=${q}` : ""}`}>
            Próxima
          </Link>
        )}
      </div>
    </div>
  );
}
