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

function parseMoney(value: string): number {
  const n = Number(String(value).replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

function lineTotal(item: Item): number {
  const gross = item.quantity * parseMoney(item.unitPrice);
  return Math.max(0, gross - parseMoney(item.discount));
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

function emptyItem(): Item {
  return {
    description: "",
    quantity: 1,
    unit: "un",
    unitPrice: "0.00",
    discount: "0.00",
  };
}

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
  const [currency, setCurrency] = useState(proposal?.currency || "BRL");
  const [items, setItems] = useState<Item[]>(
    initialItems?.map((i) => ({
      description: i.description,
      quantity: Number(i.quantity),
      unit: i.unit,
      unitPrice: i.unit_price,
      discount: i.discount,
    })) || [emptyItem()]
  );
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [toEmail, setToEmail] = useState("");
  const [busy, setBusy] = useState(false);

  const editable =
    mode === "create" ||
    proposal?.status === "DRAFT" ||
    proposal?.status === "IN_REVIEW";

  const transitions = useMemo(
    () => (proposal ? PROPOSAL_TRANSITIONS[proposal.status] : []),
    [proposal]
  );

  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + lineTotal(item), 0),
    [items]
  );

  function updateItem(index: number, patch: Partial<Item>) {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, ...patch } : item))
    );
  }

  function moveItem(index: number, direction: -1 | 1) {
    setItems((prev) => {
      const target = index + direction;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      const [row] = next.splice(index, 1);
      next.splice(target, 0, row);
      return next;
    });
  }

  async function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setOk(null);

    if (!items.some((item) => item.description.trim())) {
      setError("Adicione pelo menos um item com descrição");
      return;
    }

    setBusy(true);
    const fd = new FormData(e.currentTarget);
    const payload = {
      title: String(fd.get("title") || ""),
      currency: String(fd.get("currency") || "BRL"),
      validUntil: String(fd.get("validUntil") || "") || null,
      templateId: String(fd.get("templateId") || "") || null,
      companyId: String(fd.get("companyId") || "") || null,
      contactId: String(fd.get("contactId") || "") || null,
      opportunityId: String(fd.get("opportunityId") || "") || null,
      items: items
        .filter((item) => item.description.trim())
        .map((item, position) => ({
          description: item.description.trim(),
          quantity: item.quantity,
          unit: item.unit || "un",
          unitPrice: item.unitPrice,
          discount: item.discount,
          position,
        })),
    };

    try {
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
    } catch {
      setError("Falha de rede ao salvar");
    } finally {
      setBusy(false);
    }
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
    <div className="sa-proposal">
      {proposal && (
        <section className="sa-panel sa-proposal-toolbar">
          <div className="sa-proposal-toolbar-main">
            <div>
              <div className="sa-proposal-kicker">
                {proposal.number_display} · v{proposal.current_version}
              </div>
              <div className="sa-proposal-status">
                <span className="sa-pill">
                  {PROPOSAL_STATUS_LABELS[proposal.status]}
                </span>
                <strong>{formatMoney(Number(proposal.total || 0), proposal.currency)}</strong>
              </div>
            </div>
            <div className="sa-proposal-actions">
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
              <button
                type="button"
                className="btn btn-secondary"
                onClick={generatePdf}
              >
                Gerar/baixar PDF
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={newVersion}
              >
                Nova versão
              </button>
            </div>
          </div>
          <div className="sa-proposal-send">
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

      <form className="sa-panel sa-proposal-form" onSubmit={save}>
        <div className="sa-proposal-section-head">
          <div>
            <h2>{mode === "create" ? "Dados da proposta" : "Editar proposta"}</h2>
            <p className="muted">
              Preencha o cabeçalho e monte os itens na tabela abaixo.
            </p>
          </div>
          {editable && (
            <button className="btn btn-primary" type="submit" disabled={busy}>
              {busy ? "Salvando…" : "Salvar proposta"}
            </button>
          )}
        </div>

        <div className="sa-proposal-grid">
          <label className="sa-proposal-span-2">
            Título
            <input
              name="title"
              required
              disabled={!editable}
              defaultValue={proposal?.title || ""}
              placeholder="Ex.: Integração Discord + CS2"
            />
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
            Moeda
            <input
              name="currency"
              disabled={!editable}
              value={currency}
              onChange={(e) => setCurrency(e.target.value.toUpperCase())}
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
        </div>

        <div className="sa-proposal-items-head">
          <div>
            <h3>Itens</h3>
            <p className="muted">
              {items.length} linha(s) · total provisório{" "}
              <strong>{formatMoney(subtotal, currency)}</strong>
            </p>
          </div>
          {editable && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setItems((prev) => [...prev, emptyItem()])}
            >
              + Adicionar item
            </button>
          )}
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
                {editable && <th className="sa-col-actions">Ações</th>}
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr key={index}>
                  <td className="sa-col-num">{index + 1}</td>
                  <td className="sa-col-desc">
                    <textarea
                      disabled={!editable}
                      rows={2}
                      value={item.description}
                      placeholder="Descreva o serviço ou entregável"
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
                      disabled={!editable}
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
                      disabled={!editable}
                      value={item.unit}
                      onChange={(e) =>
                        updateItem(index, { unit: e.target.value })
                      }
                    />
                  </td>
                  <td className="sa-col-money">
                    <input
                      inputMode="decimal"
                      disabled={!editable}
                      value={item.unitPrice}
                      onChange={(e) =>
                        updateItem(index, { unitPrice: e.target.value })
                      }
                    />
                  </td>
                  <td className="sa-col-money">
                    <input
                      inputMode="decimal"
                      disabled={!editable}
                      value={item.discount}
                      onChange={(e) =>
                        updateItem(index, { discount: e.target.value })
                      }
                    />
                  </td>
                  <td className="sa-col-money sa-items-total">
                    {formatMoney(lineTotal(item), currency)}
                  </td>
                  {editable && (
                    <td className="sa-col-actions">
                      <div className="sa-item-actions">
                        <button
                          type="button"
                          className="sa-btn sa-btn-ghost"
                          title="Subir"
                          disabled={index === 0}
                          onClick={() => moveItem(index, -1)}
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          className="sa-btn sa-btn-ghost"
                          title="Descer"
                          disabled={index === items.length - 1}
                          onClick={() => moveItem(index, 1)}
                        >
                          ↓
                        </button>
                        <button
                          type="button"
                          className="sa-btn sa-btn-ghost sa-btn-danger"
                          title="Remover"
                          disabled={items.length <= 1}
                          onClick={() =>
                            setItems((prev) =>
                              prev.filter((_, i) => i !== index)
                            )
                          }
                        >
                          Remover
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={editable ? 6 : 5} className="sa-items-foot-label">
                  Total
                </td>
                <td className="sa-col-money sa-items-total">
                  {formatMoney(subtotal, currency)}
                </td>
                {editable && <td />}
              </tr>
            </tfoot>
          </table>
        </div>

        {editable && (
          <div className="sa-proposal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setItems((prev) => [...prev, emptyItem()])}
            >
              + Adicionar item
            </button>
            <button className="btn btn-primary" type="submit" disabled={busy}>
              {busy ? "Salvando…" : "Salvar proposta"}
            </button>
          </div>
        )}

        {error && <p className="sa-error">{error}</p>}
        {ok && <p className="sa-ok">{ok}</p>}
      </form>
    </div>
  );
}
