"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type CompanyOpt = {
  id: string;
  legal_name: string;
  tax_id: string | null;
};

type ContactOpt = {
  id: string;
  name: string;
  role_title: string | null;
  company_id: string | null;
};

type OpportunityOpt = {
  id: string;
  title: string;
  company_id: string | null;
};

export function NdaForm({
  companies,
  contacts,
  opportunities,
}: {
  companies: CompanyOpt[];
  contacts: ContactOpt[];
  opportunities: OpportunityOpt[];
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [companyId, setCompanyId] = useState("");
  const [contactId, setContactId] = useState("");
  const [opportunityId, setOpportunityId] = useState("");
  const [clientLegalName, setClientLegalName] = useState("");
  const [clientTaxId, setClientTaxId] = useState("");
  const [clientAddress, setClientAddress] = useState("");
  const [clientRepName, setClientRepName] = useState("");
  const [clientRepTitle, setClientRepTitle] = useState("");
  const [projectName, setProjectName] = useState("");

  const filteredContacts = useMemo(() => {
    if (!companyId) return contacts;
    return contacts.filter((c) => c.company_id === companyId);
  }, [companyId, contacts]);

  const filteredOpportunities = useMemo(() => {
    if (!companyId) return opportunities;
    return opportunities.filter((o) => o.company_id === companyId);
  }, [companyId, opportunities]);

  function applyCompany(id: string) {
    setCompanyId(id);
    const company = companies.find((c) => c.id === id);
    if (company) {
      setClientLegalName(company.legal_name);
      setClientTaxId(company.tax_id || "");
    }
    setContactId("");
    setOpportunityId("");
  }

  function applyContact(id: string) {
    setContactId(id);
    const contact = contacts.find((c) => c.id === id);
    if (contact) {
      setClientRepName(contact.name);
      setClientRepTitle(contact.role_title || "");
      if (contact.company_id && contact.company_id !== companyId) {
        applyCompany(contact.company_id);
        setContactId(id);
      }
    }
  }

  function applyOpportunity(id: string) {
    setOpportunityId(id);
    const opp = opportunities.find((o) => o.id === id);
    if (opp) {
      setProjectName(opp.title);
      if (opp.company_id && opp.company_id !== companyId) {
        applyCompany(opp.company_id);
        setOpportunityId(id);
      }
    }
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const fd = new FormData(e.currentTarget);
    const payload = {
      companyId: companyId || null,
      contactId: contactId || null,
      opportunityId: opportunityId || null,
      clientLegalName: String(fd.get("clientLegalName") || "").trim(),
      clientTaxId: String(fd.get("clientTaxId") || "").trim() || null,
      clientAddress: String(fd.get("clientAddress") || "").trim() || null,
      clientRepName: String(fd.get("clientRepName") || "").trim(),
      clientRepTitle: String(fd.get("clientRepTitle") || "").trim() || null,
      projectName: String(fd.get("projectName") || "").trim(),
      signedCity: String(fd.get("signedCity") || "").trim() || undefined,
      signedOn: String(fd.get("signedOn") || "").trim() || undefined,
    };

    try {
      const res = await fetch("/api/admin/ndas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Falha ao gerar NDA");
        return;
      }
      router.push(`/pt-br/super-admin/ndas/${data.id}`);
      router.refresh();
    } catch {
      setError("Falha de rede ao gerar NDA");
    } finally {
      setBusy(false);
    }
  }

  const today = new Date().toLocaleDateString("en-CA", {
    timeZone: "America/Sao_Paulo",
  });

  return (
    <form className="sa-panel form" onSubmit={onSubmit}>
      <h2>NDA unilateral</h2>
      <p className="muted">
        Gera o PDF com papel timbrado a partir do modelo unilateral, preenchido
        com os dados do cliente.
      </p>

      <label>
        Empresa (CRM)
        <select
          value={companyId}
          onChange={(e) => applyCompany(e.target.value)}
        >
          <option value="">— selecionar para preencher —</option>
          {companies.map((c) => (
            <option key={c.id} value={c.id}>
              {c.legal_name}
            </option>
          ))}
        </select>
      </label>

      <label>
        Contato (representante)
        <select
          value={contactId}
          onChange={(e) => applyContact(e.target.value)}
        >
          <option value="">— opcional —</option>
          {filteredContacts.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
              {c.role_title ? ` · ${c.role_title}` : ""}
            </option>
          ))}
        </select>
      </label>

      <label>
        Oportunidade / projeto
        <select
          value={opportunityId}
          onChange={(e) => applyOpportunity(e.target.value)}
        >
          <option value="">— opcional —</option>
          {filteredOpportunities.map((o) => (
            <option key={o.id} value={o.id}>
              {o.title}
            </option>
          ))}
        </select>
      </label>

      <hr />

      <label>
        Razão social do cliente
        <input
          name="clientLegalName"
          required
          value={clientLegalName}
          onChange={(e) => setClientLegalName(e.target.value)}
        />
      </label>
      <label>
        CNPJ / Tax ID
        <input
          name="clientTaxId"
          value={clientTaxId}
          onChange={(e) => setClientTaxId(e.target.value)}
        />
      </label>
      <label>
        Endereço
        <textarea
          name="clientAddress"
          value={clientAddress}
          onChange={(e) => setClientAddress(e.target.value)}
          rows={2}
        />
      </label>
      <label>
        Representante legal
        <input
          name="clientRepName"
          required
          value={clientRepName}
          onChange={(e) => setClientRepName(e.target.value)}
        />
      </label>
      <label>
        Cargo do representante
        <input
          name="clientRepTitle"
          value={clientRepTitle}
          onChange={(e) => setClientRepTitle(e.target.value)}
          placeholder="Representante legal"
        />
      </label>
      <label>
        Projeto / sistema
        <input
          name="projectName"
          required
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
        />
      </label>
      <label>
        Cidade de assinatura
        <input name="signedCity" defaultValue="Embu Guaçu - SP" />
      </label>
      <label>
        Data
        <input name="signedOn" type="date" defaultValue={today} required />
      </label>

      {error && <p className="sa-error">{error}</p>}
      <button className="btn btn-primary" type="submit" disabled={busy}>
        {busy ? "Gerando…" : "Gerar NDA PDF"}
      </button>
    </form>
  );
}
