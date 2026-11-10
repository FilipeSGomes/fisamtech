import Link from "next/link";
import { ProposalEditor } from "@/components/super-admin/ProposalEditor";
import { listCompanies } from "@/lib/super-admin/crm/companies";
import { listContacts } from "@/lib/super-admin/crm/contacts";
import { listOpportunities } from "@/lib/super-admin/crm/opportunities";
import { listProposalTemplates } from "@/lib/super-admin/proposals/service";

export const dynamic = "force-dynamic";

export default async function NewProposalPage() {
  const [templates, companies, contacts, opportunities] = await Promise.all([
    listProposalTemplates(),
    listCompanies({ pageSize: 200 }),
    listContacts({ pageSize: 200 }),
    listOpportunities({ pageSize: 200, status: "OPEN" }),
  ]);

  return (
    <div className="sa-page">
      <p>
        <Link href="/pt-br/super-admin/proposals">← Propostas</Link>
      </p>
      <h1>Nova proposta</h1>
      <ProposalEditor
        mode="create"
        templates={templates}
        companies={companies.items.map((c) => ({
          id: c.id,
          legal_name: c.legal_name,
        }))}
        contacts={contacts.items.map((c) => ({
          id: c.id,
          name: c.name,
          email: c.email,
        }))}
        opportunities={opportunities.items.map((o) => ({
          id: o.id,
          title: o.title,
        }))}
      />
    </div>
  );
}
