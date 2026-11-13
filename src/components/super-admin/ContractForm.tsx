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

type ProposalOpt = {
  id: string;
  number_display: string;
  title: string;
  company_id: string | null;
  company_name: string | null;
  contact_id: string | null;
  contact_name: string | null;
  currency: string;
  total: string | null;
};

type Item = {
  description: string;
  quantity: number;
  unit: string;
  unitPrice: string;
  discount: string;
};

function emptyItem(): Item {
  return {
    description: "",
    quantity: 1,
    unit: "un",
    unitPrice: "0.00",
    discount: "0.00",
  };
}

function parseMoney(value: string): number {
  const n = Number(String(value).replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

function lineTotal(item: Item): number {
  return Math.max(
    0,
    item.quantity * parseMoney(item.unitPrice) - parseMoney(item.discount)
  );
}

function formatMoney(value: number, currency: string): string {
  try {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: currency || "BRL",
    }).format(value);
  } catch {
    return `${currency} ${value.toFixed(2)}`;
  }
}

export function ContractForm({
  companies,
  contacts,
  opportunities,
  proposals,
}: {
  companies: CompanyOpt[];
  contacts: ContactOpt[];
  opportunities: OpportunityOpt[];
  proposals: ProposalOpt[];
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [loadingProposal, setLoadingProposal] = useState(false);
  const [proposalId, setProposalId] = useState("");
  const [companyId, setCompanyId] = useState("");
  const [contactId, setContactId] = useState("");
  const [opportunityId, setOpportunityId] = useState("");
  const [clientLegalName, setClientLegalName] = useState("");
  const [clientTaxId, setClientTaxId] = useState("");
  const [clientAddress, setClientAddress] = useState("");
  const [clientRepName, setClientRepName] = useState("");
  const [clientRepTitle, setClientRepTitle] = useState("");
  const [projectName, setProjectName] = useState("");
  const [currency, setCurrency] = useState("BRL");
  const [items, setItems] = useState<Item[]>([emptyItem()]);

  const filteredContacts = useMemo(() => {
    if (!companyId) return contacts;
    return contacts.filter((c) => c.company_id === companyId);
  }, [companyId, contacts]);

  const filteredOpportunities = useMemo(() => {
    if (!companyId) return opportunities;
    return opportunities.filter((o) => o.company_id === companyId);
  }, [companyId, opportunities]);

  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + lineTotal(item), 0),
    [items]
  );

  function applyCompany(id: string) {
    setCompanyId(id);
    const company = companies.find((c) => c.id === id);
    if (company) {
      setClientLegalName(company.legal_name);
      setClientTaxId(company.tax_id || "");
    }
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
      if (!projectName) setProjectName(opp.title);
      if (opp.company_id && opp.company_id !== companyId) {
        applyCompany(opp.company_id);
        setOpportunityId(id);
      }
    }
  }

  function updateItem(index: number, patch: Partial<Item>) {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, ...patch } : item))
    );
  }

  async function loadFromProposal(id: string) {
    setProposalId(id);
    if (!id) return;
    setLoadingProposal(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/proposals/${id}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Falha ao carregar proposta");
        return;
      }
      const p = data.proposal;
      const proposalItems = data.items || [];
      setCurrency(p.currency || "BRL");
      setProjectName(p.title || "");
      if (p.company_id) applyCompany(p.company_id);
      else if (p.company_name) setClientLegalName(p.company_name);
      if (p.contact_id) applyContact(p.contact_id);
      else if (p.contact_name) setClientRepName(p.contact_name);
      if (p.opportunity_id) setOpportunityId(p.opportunity_id);
      if (proposalItems.length) {
        setItems(
          proposalItems.map(
            (i: {
              description: string;
              quantity: string;
              unit: string;
              unit_price: string;
              discount: string;
            }) => ({
              description: i.description,
              quantity: Number(i.quantity),
              unit: i.unit || "un",
              unitPrice: i.unit_price,
              discount: i.discount || "0.00",
            })
          )
        );
      }
    } catch {
      setError("Falha de rede ao carregar proposta");
    } finally {
      setLoadingProposal(false);
    }
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const cleanItems = items
      .filter((item) => item.description.trim())
      .map((item) => ({
        description: item.description.trim(),
        quantity: item.quantity,
        unit: item.unit || "un",
        unitPrice: item.unitPrice,
        discount: item.discount,
      }));

    if (!cleanItems.length) {
      setError("Adicione pelo menos um item");
      return;
    }

    setBusy(true);
    const fd = new FormData(e.currentTarget);
    const payload = {
      proposalId: proposalId || null,
      companyId: companyId || null,
      contactId: contactId || null,
      opportunityId: opportunityId || null,
      clientLegalName: String(fd.get("clientLegalName") || "").trim(),
      clientTaxId: String(fd.get("clientTaxId") || "").trim() || null,
      clientAddress: String(fd.get("clientAddress") || "").trim() || null,
      clientRepName: String(fd.get("clientRepName") || "").trim(),
      clientRepTitle: String(fd.get("clientRepTitle") || "").trim() || null,
      projectName: String(fd.get("projectName") || "").trim(),
      currency: String(fd.get("currency") || "BRL").trim(),
      paymentTerms: String(fd.get("paymentTerms") || "").trim(),
      termMonths: Number(fd.get("termMonths") || 12),
      startOn: String(fd.get("startOn") || "").trim() || null,
      signedCity: String(fd.get("signedCity") || "").trim() || undefined,
      signedOn: String(fd.get("signedOn") || "").trim() || undefined,
      notes: String(fd.get("notes") || "").trim() || null,
      items: cleanItems,
    };

    try {
      const res = await fetch("/api/admin/contracts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Falha ao gerar contrato");
        return;
      }
      router.push(`/pt-br/super-admin/contracts/${data.id}`);
      router.refresh();
    } catch {
      setError("Falha de rede ao gerar contrato");
    } finally {
      setBusy(false);
    }
  }

  const today = new Date().toLocaleDateString("en-CA", {
    timeZone: "America/Sao_Paulo",
  });

  return (
    <form className="sa-panel sa-proposal-form" onSubmit={onSubmit}>
      <div className="sa-proposal-section-head">
        <div>
          <h2>Contrato de prestação de serviços</h2>
          <p className="muted">
            Importe uma proposta existente ou monte os itens manualmente.
          </p>
        </div>
        <button className="btn btn-primary" type="submit" disabled={busy}>
          {busy ? "Gerando…" : "Gerar contrato PDF"}
        </button>
      </div>

      <label>
        Proposta de origem
        <select
          value={proposalId}
          disabled={loadingProposal}
          onChange={(e) => loadFromProposal(e.target.value)}
        >
          <option value="">— opcional: carregar proposta —</option>
          {proposals.map((p) => (
            <option key={p.id} value={p.id}>
              {p.number_display} · {p.title}
              {p.company_name ? ` · ${p.company_name}` : ""}
              {p.total ? ` · ${p.currency} ${p.total}` : ""}
            </option>
          ))}
        </select>
      </label>
      {loadingProposal && <p className="muted">Carregando itens da proposta…</p>}

      <div className="sa-proposal-grid">
        <label>
          Empresa (CRM)
          <select
            value={companyId}
            onChange={(e) => applyCompany(e.target.value)}
          >
            <option value="">—</option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.legal_name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Contato / representante
          <select
            value={contactId}
            onChange={(e) => applyContact(e.target.value)}
          >
            <option value="">—</option>
            {filteredContacts.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
                {c.role_title ? ` · ${c.role_title}` : ""}
              </option>
            ))}
          </select>
        </label>
        <label>
          Oportunidade
          <select
            value={opportunityId}
            onChange={(e) => applyOpportunity(e.target.value)}
          >
            <option value="">—</option>
            {filteredOpportunities.map((o) => (
              <option key={o.id} value={o.id}>
                {o.title}
              </option>
            ))}
          </select>
        </label>
        <label>
          Moeda
          <input
            name="currency"
            value={currency}
            onChange={(e) => setCurrency(e.target.value.toUpperCase())}
          />
        </label>

        <label className="sa-proposal-span-2">
          Projeto / objeto
          <input
            name="projectName"
            required
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
          />
        </label>
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
        <label className="sa-proposal-span-2">
          Endereço
          <textarea
            name="clientAddress"
            rows={2}
            value={clientAddress}
            onChange={(e) => setClientAddress(e.target.value)}
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
          Cargo
          <input
            name="clientRepTitle"
            value={clientRepTitle}
            onChange={(e) => setClientRepTitle(e.target.value)}
            placeholder="Representante legal"
          />
        </label>
        <label className="sa-proposal-span-2">
          Condições de pagamento
          <input
            name="paymentTerms"
            defaultValue="50% na assinatura e 50% na entrega/aceite"
          />
        </label>
        <label>
          Prazo (meses)
          <input name="termMonths" type="number" min={1} defaultValue={12} />
        </label>
        <label>
          Início
          <input name="startOn" type="date" />
        </label>
        <label>
          Cidade de assinatura
          <input name="signedCity" defaultValue="Embu Guaçu - SP" />
        </label>
        <label>
          Data
          <input name="signedOn" type="date" defaultValue={today} required />
        </label>
        <label className="sa-proposal-span-2">
          Observações internas
          <textarea name="notes" rows={2} />
        </label>
      </div>

      <div className="sa-proposal-items-head">
        <div>
          <h3>Itens do contrato</h3>
          <p className="muted">
            {items.length} linha(s) · total provisório{" "}
            <strong>{formatMoney(subtotal, currency)}</strong>
          </p>
        </div>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => setItems((prev) => [...prev, emptyItem()])}
        >
          + Adicionar item
        </button>
      </div>

      <div className="sa-table-wrap sa-items-wrap">
        <table className="sa-table sa-items-table">
          <thead>
            <tr>
              <th className="sa-col-num">#</th>
              <th className="sa-col-desc">Descrição</th>
              <th className="sa-col-qty">Qtd</th>
              <th className="sa-col-unit">Un</th>
              <th className="sa-col-money">Preço unit.</th>
              <th className="sa-col-money">Desconto</th>
              <th className="sa-col-money">Total</th>
              <th className="sa-col-actions">Ações</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr key={index}>
                <td className="sa-col-num">{index + 1}</td>
                <td className="sa-col-desc">
                  <textarea
                    rows={2}
                    value={item.description}
                    placeholder="Serviço / entregável"
                    onChange={(e) =>
                      updateItem(index, { description: e.target.value })
                    }
                  />
                </td>
                <td className="sa-col-qty">
                  <input
                    type="number"
                    min="0"
                    step="0.001"
                    value={item.quantity}
                    onChange={(e) =>
                      updateItem(index, {
                        quantity: Number(e.target.value || 0),
                      })
                    }
                  />
                </td>
                <td className="sa-col-unit">
                  <input
                    value={item.unit}
                    onChange={(e) =>
                      updateItem(index, { unit: e.target.value })
                    }
                  />
                </td>
                <td className="sa-col-money">
                  <input
                    inputMode="decimal"
                    value={item.unitPrice}
                    onChange={(e) =>
                      updateItem(index, { unitPrice: e.target.value })
                    }
                  />
                </td>
                <td className="sa-col-money">
                  <input
                    inputMode="decimal"
                    value={item.discount}
                    onChange={(e) =>
                      updateItem(index, { discount: e.target.value })
                    }
                  />
                </td>
                <td className="sa-col-money sa-items-total">
                  {formatMoney(lineTotal(item), currency)}
                </td>
                <td className="sa-col-actions">
                  <button
                    type="button"
                    className="sa-btn sa-btn-ghost sa-btn-danger"
                    disabled={items.length <= 1}
                    onClick={() =>
                      setItems((prev) => prev.filter((_, i) => i !== index))
                    }
                  >
                    Remover
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={6} className="sa-items-foot-label">
                Total
              </td>
              <td className="sa-col-money sa-items-total">
                {formatMoney(subtotal, currency)}
              </td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="sa-proposal-footer">
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => setItems((prev) => [...prev, emptyItem()])}
        >
          + Adicionar item
        </button>
        <button className="btn btn-primary" type="submit" disabled={busy}>
          {busy ? "Gerando…" : "Gerar contrato PDF"}
        </button>
      </div>

      {error && <p className="sa-error">{error}</p>}
    </form>
  );
}
