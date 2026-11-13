import Link from "next/link";
import { notFound } from "next/navigation";
import { getContract } from "@/lib/super-admin/contracts/service";

export const dynamic = "force-dynamic";

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Rascunho",
  ISSUED: "Emitido",
  SIGNED: "Assinado",
  CANCELLED: "Cancelado",
};

type ContractItem = {
  description: string;
  quantity: number;
  unit: string;
  unitPrice: string;
  discount: string;
  lineTotal: string;
};

export default async function ContractDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const contract = await getContract(id);
  if (!contract) notFound();

  const row = contract as Record<string, unknown>;
  const numberDisplay = String(row.number_display ?? "");
  const status = String(row.status ?? "");
  const signedOn = String(row.signed_on ?? "").slice(0, 10);
  const currency = String(row.currency ?? "BRL");
  const items = (Array.isArray(row.items) ? row.items : []) as ContractItem[];

  return (
    <div className="sa-page">
      <p>
        <Link href="/pt-br/super-admin/contracts">← Contratos</Link>
      </p>
      <div className="sa-page-head">
        <div>
          <h1>{numberDisplay}</h1>
          <p className="muted">
            {STATUS_LABELS[status] || status} · {signedOn}
          </p>
        </div>
        <a
          className="btn btn-primary"
          href={`/api/admin/contracts/${id}/pdf`}
          target="_blank"
          rel="noreferrer"
        >
          Baixar PDF
        </a>
      </div>

      <div className="sa-panel">
        <dl className="sa-dl">
          <div>
            <dt>Cliente</dt>
            <dd>{String(row.client_legal_name ?? "")}</dd>
          </div>
          <div>
            <dt>CNPJ / Tax ID</dt>
            <dd>{String(row.client_tax_id || "—")}</dd>
          </div>
          <div>
            <dt>Representante</dt>
            <dd>
              {String(row.client_rep_name ?? "")}
              {row.client_rep_title
                ? ` · ${String(row.client_rep_title)}`
                : ""}
            </dd>
          </div>
          <div>
            <dt>Projeto</dt>
            <dd>{String(row.project_name ?? "")}</dd>
          </div>
          <div>
            <dt>Pagamento</dt>
            <dd>{String(row.payment_terms ?? "")}</dd>
          </div>
          <div>
            <dt>Total</dt>
            <dd>
              {currency} {String(row.total ?? "0.00")}
            </dd>
          </div>
          {row.proposal_id ? (
            <div>
              <dt>Proposta</dt>
              <dd>
                <Link href={`/pt-br/super-admin/proposals/${String(row.proposal_id)}`}>
                  Abrir proposta de origem
                </Link>
              </dd>
            </div>
          ) : null}
        </dl>
      </div>

      <div className="sa-table-wrap" style={{ marginTop: 16 }}>
        <table className="sa-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Descrição</th>
              <th>Qtd</th>
              <th>Un</th>
              <th>Preço</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr key={index}>
                <td>{index + 1}</td>
                <td>{item.description}</td>
                <td>{item.quantity}</td>
                <td>{item.unit}</td>
                <td>
                  {currency} {item.unitPrice}
                </td>
                <td>
                  {currency} {item.lineTotal}
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={6} className="muted">
                  Sem itens.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
