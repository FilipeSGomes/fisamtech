import Link from "next/link";
import { notFound } from "next/navigation";
import { ProposalEditor } from "@/components/super-admin/ProposalEditor";
import { getAdminSessionFromCookies } from "@/lib/super-admin/auth/session";
import { listCompanies } from "@/lib/super-admin/crm/companies";
import { listContacts } from "@/lib/super-admin/crm/contacts";
import { listOpportunities } from "@/lib/super-admin/crm/opportunities";
import {
  getProposal,
  listProposalItems,
  listProposalTemplates,
} from "@/lib/super-admin/proposals/service";
import { requireAdminPage } from "@/lib/super-admin/rbac/page-gate";

export const dynamic = "force-dynamic";

export default async function ProposalDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdminPage("proposals:read");
  const { id } = await params;
  const proposal = await getProposal(id);
  if (!proposal) notFound();

  const [items, templates, companies, contacts, opportunities, session] =
    await Promise.all([
      listProposalItems(id),
      listProposalTemplates(),
      listCompanies({ pageSize: 200 }),
      listContacts({ pageSize: 200 }),
      listOpportunities({ pageSize: 200 }),
      getAdminSessionFromCookies(),
    ]);

  return (
    <div className="sa-page">
      <p>
        <Link href="/pt-br/super-admin/proposals">← Propostas</Link>
      </p>
      <div className="sa-page-head">
        <div>
          <h1>{proposal.title}</h1>
          <p className="muted">
            {proposal.number_display} · v{proposal.current_version}
          </p>
        </div>
      </div>
      <ProposalEditor
        mode="edit"
        proposal={proposal}
        items={items}
        sessionUser={
          session
            ? { name: session.name, email: session.email }
            : null
        }
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
