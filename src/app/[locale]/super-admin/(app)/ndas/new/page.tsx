import Link from "next/link";
import { NdaForm } from "@/components/super-admin/NdaForm";
import { listCompanies } from "@/lib/super-admin/crm/companies";
import { listContacts } from "@/lib/super-admin/crm/contacts";
import { listOpportunities } from "@/lib/super-admin/crm/opportunities";

export const dynamic = "force-dynamic";

export default async function NewNdaPage() {
  const [companies, contacts, opportunities] = await Promise.all([
    listCompanies({ pageSize: 200 }),
    listContacts({ pageSize: 200 }),
    listOpportunities({ pageSize: 200 }),
  ]);

  return (
    <div className="sa-page">
      <p>
        <Link href="/pt-br/super-admin/ndas">← NDAs</Link>
      </p>
      <h1>Novo NDA unilateral</h1>
      <NdaForm
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
      />
    </div>
  );
}
