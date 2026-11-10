"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  PROPOSAL_STATUS_LABELS,
  PROPOSAL_TRANSITIONS,
  type ProposalStatus,
} from "@/lib/super-admin/proposals/workflow";

type Item = {
  description: string;
  quantity: number;
  unit: string;
  unitPrice: string;
  discount: string;
};

export function ProposalEditor({
  mode,
  templates,
  companies,
  contacts,
  opportunities,
  proposal,
  items: initialItems,
}: {
  mode: "create" | "edit";
  templates: Array<{ id: string; name: string }>;
  companies: Array<{ id: string; legal_name: string }>;
  contacts: Array<{ id: string; name: string; email: string | null }>;
  opportunities: Array<{ id: string; title: string }>;
  proposal?: {
    id: string;
    title: string;
    currency: string;
    valid_until: string | null;
    status: ProposalStatus;
    number_display: string;
    current_version: number;
    company_id: string | null;
    contact_id: string | null;
    opportunity_id: string | null;
    template_id: string | null;
    total: string | null;
  };
  items?: Array<{
    description: string;
    quantity: string;
    unit: string;
    unit_price: string;
    discount: string;
  }>;
}) {
  const router = useRouter();
  const [items, setItems] = useState<Item[]>(
    initialItems?.map((i) => ({
      description: i.description,
      quantity: Number(i.quantity),
      unit: i.unit,
      unitPrice: i.unit_price,
      discount: i.discount,
    })) || [
      {
        description: "Diagnóstico técnico",
        quantity: 1,
        unit: "un",
        unitPrice: "4500.00",
        discount: "0.00",
      },
    ]
  );
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [toEmail, setToEmail] = useState("");

  const editable =
    mode === "create" ||
    proposal?.status === "DRAFT" ||
    proposal?.status === "IN_REVIEW";

  const transitions = useMemo(
    () => (proposal ? PROPOSAL_TRANSITIONS[proposal.status] : []),
    [proposal]
  );

  async function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setOk(null);
    const fd = new FormData(e.currentTarget);
    const payload = {
      title: String(fd.get("title") || ""),
      currency: String(fd.get("currency") || "BRL"),
      validUntil: String(fd.get("validUntil") || "") || null,
      templateId: String(fd.get("templateId") || "") || null,
      companyId: String(fd.get("companyId") || "") || null,
      contactId: String(fd.get("contactId") || "") || null,
      opportunityId: String(fd.get("opportunityId") || "") || null,
      items: items.map((item, position) => ({
        ...item,
        unitPrice: item.unitPrice,
        discount: item.discount,
        position,
      })),
    };
    const res = await fetch(
      mode === "create"
        ? "/api/admin/proposals"
        : `/api/admin/proposals/${proposal!.id}`,
      {
        method: mode === "create" ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Falha ao salvar");
      return;
    }
    setOk("Salvo");
    if (mode === "create" && data.id) {
      router.push(`/pt-br/super-admin/proposals/${data.id}`);
      return;
    }
    router.refresh();
  }

  async function transition(status: ProposalStatus) {
    setError(null);
    const res = await fetch(`/api/admin/proposals/${proposal!.id}/transition`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Falha na transição");
      return;
    }
    router.refresh();
  }

  async function generatePdf() {
    setError(null);
    const res = await fetch(`/api/admin/proposals/${proposal!.id}/pdf`, {
      method: "POST",
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Falha ao gerar PDF");
      return;
    }
    setOk("PDF gerado");
    window.open(`/api/admin/proposals/${proposal!.id}/pdf`, "_blank");
  }

  async function sendEmail() {
    setError(null);
    const res = await fetch(`/api/admin/proposals/${proposal!.id}/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ toEmail: toEmail || undefined }),
    });
    const data = await res.json();
    if (!res.ok && res.status !== 202) {
      setError(data.error || data.reason || "Falha no envio");
      return;
    }
    if (data.status === "pending_config") {
      setOk("Registrado como pending_config (e-mail não configurado)");
    } else if (data.status === "sent") {
      setOk("Proposta enviada");
    } else {
      setError(data.reason || "Falha no envio");
    }
    router.refresh();
  }

  async function newVersion() {
    const res = await fetch(`/api/admin/proposals/${proposal!.id}/version`, {
      method: "POST",
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Falha ao versionar");
      return;
    }
    router.refresh();
  }

  return (
    <div className="sa-panels" style={{ gridTemplateColumns: "1fr" }}>
      {proposal && (
        <section className="sa-panel">
          <h2>
            {proposal.number_display} · v{proposal.current_version}
          </h2>
          <p className="muted">
            Status: {PROPOSAL_STATUS_LABELS[proposal.status]} · Total:{" "}
            {proposal.currency} {proposal.total || "0.00"}
          </p>
          <div className="sa-filters">
            {transitions.map((status) => (
              <button
                key={status}
                type="button"
                className="btn btn-secondary"
                onClick={() => transition(status)}
              >
                → {PROPOSAL_STATUS_LABELS[status]}
              </button>
            ))}
            <button type="button" className="btn btn-secondary" onClick={generatePdf}>
              Gerar/baixar PDF
            </button>
            <button type="button" className="btn btn-secondary" onClick={newVersion}>
              Nova versão
            </button>
          </div>
          <div className="sa-filters" style={{ marginTop: 12 }}>
            <input
              placeholder="E-mail para envio"
              value={toEmail}
              onChange={(e) => setToEmail(e.target.value)}
            />
            <button type="button" className="btn btn-primary" onClick={sendEmail}>
              Registrar envio
            </button>
          </div>
        </section>
      )}

      <form className="sa-panel form" onSubmit={save}>
        <h2>{mode === "create" ? "Nova proposta" : "Editar proposta"}</h2>
        <label>
          Título
          <input
            name="title"
            required
            disabled={!editable}
            defaultValue={proposal?.title || ""}
          />
        </label>
        <label>
          Template
          <select
            name="templateId"
            disabled={!editable}
            defaultValue={proposal?.template_id || ""}
          >
            <option value="">—</option>
            {templates.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Empresa
          <select
            name="companyId"
            disabled={!editable}
            defaultValue={proposal?.company_id || ""}
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
          Contato
          <select
            name="contactId"
            disabled={!editable}
            defaultValue={proposal?.contact_id || ""}
          >
            <option value="">—</option>
            {contacts.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
                {c.email ? ` (${c.email})` : ""}
              </option>
            ))}
          </select>
        </label>
        <label>
          Oportunidade
          <select
            name="opportunityId"
            disabled={!editable}
            defaultValue={proposal?.opportunity_id || ""}
          >
            <option value="">—</option>
            {opportunities.map((o) => (
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
            disabled={!editable}
            defaultValue={proposal?.currency || "BRL"}
          />
        </label>
        <label>
          Validade
          <input
            name="validUntil"
            type="date"
            disabled={!editable}
            defaultValue={proposal?.valid_until || ""}
          />
        </label>

        <h3>Itens</h3>
        {items.map((item, index) => (
          <div key={index} className="sa-panel" style={{ padding: 12 }}>
            <label>
              Descrição
              <input
                disabled={!editable}
                value={item.description}
                onChange={(e) => {
                  const next = [...items];
                  next[index] = { ...item, description: e.target.value };
                  setItems(next);
                }}
              />
            </label>
            <div className="sa-filters">
              <label>
                Qtd
                <input
                  type="number"
                  step="0.001"
                  disabled={!editable}
                  value={item.quantity}
                  onChange={(e) => {
                    const next = [...items];
                    next[index] = { ...item, quantity: Number(e.target.value) };
                    setItems(next);
                  }}
                />
              </label>
              <label>
                Unidade
                <input
                  disabled={!editable}
                  value={item.unit}
                  onChange={(e) => {
                    const next = [...items];
                    next[index] = { ...item, unit: e.target.value };
                    setItems(next);
                  }}
                />
              </label>
              <label>
                Preço
                <input
                  disabled={!editable}
                  value={item.unitPrice}
                  onChange={(e) => {
                    const next = [...items];
                    next[index] = { ...item, unitPrice: e.target.value };
                    setItems(next);
                  }}
                />
              </label>
              <label>
                Desconto
                <input
                  disabled={!editable}
                  value={item.discount}
                  onChange={(e) => {
                    const next = [...items];
                    next[index] = { ...item, discount: e.target.value };
                    setItems(next);
                  }}
                />
              </label>
            </div>
            {editable && items.length > 1 && (
              <button
                type="button"
                className="sa-btn sa-btn-ghost"
                onClick={() => setItems(items.filter((_, i) => i !== index))}
              >
                Remover item
              </button>
            )}
          </div>
        ))}
        {editable && (
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() =>
              setItems([
                ...items,
                {
                  description: "",
                  quantity: 1,
                  unit: "un",
                  unitPrice: "0.00",
                  discount: "0.00",
                },
              ])
            }
          >
            + Item
          </button>
        )}

        {error && <p className="sa-error">{error}</p>}
        {ok && <p className="sa-ok">{ok}</p>}
        {editable && (
          <button className="btn btn-primary" type="submit">
            Salvar proposta
          </button>
        )}
      </form>
    </div>
  );
}
