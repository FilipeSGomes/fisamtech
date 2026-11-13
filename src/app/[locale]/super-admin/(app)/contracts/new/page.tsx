import Link from "next/link";
import { ContractForm } from "@/components/super-admin/ContractForm";
import { listCompanies } from "@/lib/super-admin/crm/companies";
import { listContacts } from "@/lib/super-admin/crm/contacts";
import { listOpportunities } from "@/lib/super-admin/crm/opportunities";
import { listProposals } from "@/lib/super-admin/proposals/service";

export const dynamic = "force-dynamic";

export default async function NewContractPage() {
  const [companies, contacts, opportunities, proposals] = await Promise.all([
    listCompanies({ pageSize: 200 }),
    listContacts({ pageSize: 200 }),
    listOpportunities({ pageSize: 200 }),
    listProposals({ pageSize: 100 }),
  ]);

  return (
    <div className="sa-page">
      <p>
        <Link href="/pt-br/super-admin/contracts">← Contratos</Link>
      </p>
      <div className="sa-page-head">
        <div>
          <h1>Novo contrato</h1>
          <p className="muted">
            Prestação de serviços com papel timbrado — a partir de proposta ou
            itens manuais.
          </p>
        </div>
      </div>
      <ContractForm
        companies={companies.items.map((c) => ({
          id: c.id,
          legal_name: c.legal_name,
          tax_id: c.tax_id,
        }))}
        contacts={contacts.items.map((c) => ({
          id: c.id,
          name: c.name,
          role_title: c.role_title,
          company_id: c.company_id,
        }))}
        opportunities={opportunities.items.map((o) => ({
          id: o.id,
          title: o.title,
          company_id: o.company_id,
        }))}
        proposals={proposals.items.map((p) => ({
          id: p.id,
          number_display: p.number_display,
          title: p.title,
          company_id: p.company_id,
          company_name: p.company_name,
          contact_id: p.contact_id,
          contact_name: p.contact_name,
          currency: p.currency,
          total: p.total,
        }))}
      />
    </div>
  );
}
