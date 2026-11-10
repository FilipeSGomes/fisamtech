import Link from "next/link";
import { ContactForm } from "@/components/super-admin/ContactForm";
import { listCompanies } from "@/lib/super-admin/crm/companies";
import { listContacts } from "@/lib/super-admin/crm/contacts";

export const dynamic = "force-dynamic";

export default async function ContactsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q : undefined;
  const page = Number(typeof sp.page === "string" ? sp.page : 1);
  const [data, companies] = await Promise.all([
    listContacts({ q, page, pageSize: 25 }),
    listCompanies({ pageSize: 200 }),
  ]);

  return (
    <div className="sa-page">
      <div className="sa-page-head">
        <div>
          <h1>Contatos</h1>
          <p className="muted">{data.total} registro(s)</p>
        </div>
      </div>

      <form className="sa-filters" method="get">
        <input name="q" placeholder="Buscar nome / e-mail" defaultValue={q || ""} />
        <button className="btn btn-primary" type="submit">
          Filtrar
        </button>
      </form>

      <div className="sa-panels">
        <div className="sa-table-wrap">
          <table className="sa-table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Empresa</th>
                <th>Telefone</th>
                <th>Cargo</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((c) => (
                <tr key={c.id}>
                  <td>
                    <strong>{c.name}</strong>
                    <div className="muted">{c.email || "—"}</div>
                  </td>
                  <td>{c.company_name || "—"}</td>
                  <td>{c.phone || "—"}</td>
                  <td>{c.role_title || "—"}</td>
                </tr>
              ))}
              {data.items.length === 0 && (
                <tr>
                  <td colSpan={4} className="muted">
                    Nenhum contato.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <ContactForm
          companies={companies.items.map((c) => ({
            id: c.id,
            legal_name: c.legal_name,
          }))}
        />
      </div>

      <div className="sa-pagination">
        {page > 1 && (
          <Link href={`/pt-br/super-admin/contacts?page=${page - 1}${q ? `&q=${q}` : ""}`}>
            Anterior
          </Link>
        )}
        <span>Página {data.page}</span>
        {data.page * data.pageSize < data.total && (
          <Link href={`/pt-br/super-admin/contacts?page=${page + 1}${q ? `&q=${q}` : ""}`}>
            Próxima
          </Link>
        )}
      </div>
    </div>
  );
}
