import Link from "next/link";
import { notFound } from "next/navigation";
import { getNda } from "@/lib/super-admin/nda/service";

export const dynamic = "force-dynamic";

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Rascunho",
  ISSUED: "Emitido",
  SIGNED: "Assinado",
  CANCELLED: "Cancelado",
};

export default async function NdaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const nda = await getNda(id);
  if (!nda) notFound();

  const row = nda as Record<string, unknown>;
  const numberDisplay = String(row.number_display ?? "");
  const status = String(row.status ?? "");
  const signedOn = String(row.signed_on ?? "").slice(0, 10);

  return (
    <div className="sa-page">
      <p>
        <Link href="/pt-br/super-admin/ndas">← NDAs</Link>
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
          href={`/api/admin/ndas/${id}/pdf`}
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
            <dt>Endereço</dt>
            <dd>{String(row.client_address || "—")}</dd>
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
            <dt>Local / data</dt>
            <dd>
              {String(row.signed_city ?? "")}, {signedOn}
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
