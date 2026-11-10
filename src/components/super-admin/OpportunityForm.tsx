"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import {
  OPP_STAGE_LABELS,
  OPP_STAGES,
  type OppStage,
} from "@/lib/super-admin/crm/opportunity-status";

export function OpportunityForm({
  companies,
  contacts,
  initial,
}: {
  companies: Array<{ id: string; legal_name: string }>;
  contacts: Array<{ id: string; name: string }>;
  initial?: {
    id: string;
    title: string;
    service: string | null;
    description: string | null;
    estimated_value: string | null;
    currency: string;
    stage: OppStage;
    probability: number;
    company_id: string | null;
    contact_id: string | null;
    next_action_note: string | null;
  };
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setOk(null);
    const fd = new FormData(e.currentTarget);
    const estimatedRaw = String(fd.get("estimatedValue") || "");
    const payload = {
      title: String(fd.get("title") || ""),
      service: String(fd.get("service") || "") || null,
      description: String(fd.get("description") || "") || null,
      estimatedValue: estimatedRaw ? Number(estimatedRaw) : null,
      currency: String(fd.get("currency") || "BRL"),
      stage: String(fd.get("stage") || "QUALIFICATION") as OppStage,
      probability: Number(fd.get("probability") || 10),
      companyId: String(fd.get("companyId") || "") || null,
      contactId: String(fd.get("contactId") || "") || null,
      nextActionNote: String(fd.get("nextActionNote") || "") || null,
      note: String(fd.get("note") || "") || undefined,
      lostReason: String(fd.get("lostReason") || "") || undefined,
    };
    const res = await fetch(
      initial
        ? `/api/admin/opportunities/${initial.id}`
        : "/api/admin/opportunities",
      {
        method: initial ? "PATCH" : "POST",
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
    router.refresh();
    if (!initial && data.id) {
      router.push(`/pt-br/super-admin/opportunities`);
    }
  }

  return (
    <form className="sa-panel form" onSubmit={onSubmit}>
      <h2>{initial ? "Editar oportunidade" : "Nova oportunidade"}</h2>
      <label>
        Título
        <input name="title" required defaultValue={initial?.title || ""} />
      </label>
      <label>
        Serviço
        <input name="service" defaultValue={initial?.service || ""} />
      </label>
      <label>
        Descrição
        <textarea name="description" defaultValue={initial?.description || ""} />
      </label>
      <label>
        Valor estimado
        <input
          name="estimatedValue"
          type="number"
          step="0.01"
          defaultValue={initial?.estimated_value || ""}
        />
      </label>
      <label>
        Moeda
        <input name="currency" defaultValue={initial?.currency || "BRL"} />
      </label>
      <label>
        Estágio
        <select name="stage" defaultValue={initial?.stage || "QUALIFICATION"}>
          {OPP_STAGES.map((s) => (
            <option key={s} value={s}>
              {OPP_STAGE_LABELS[s]}
            </option>
          ))}
        </select>
      </label>
      <label>
        Probabilidade (%)
        <input
          name="probability"
          type="number"
          min={0}
          max={100}
          defaultValue={initial?.probability ?? 10}
        />
      </label>
      <label>
        Empresa
        <select name="companyId" defaultValue={initial?.company_id || ""}>
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
        <select name="contactId" defaultValue={initial?.contact_id || ""}>
          <option value="">—</option>
          {contacts.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </label>
      <label>
        Próxima ação
        <input
          name="nextActionNote"
          defaultValue={initial?.next_action_note || ""}
        />
      </label>
      {initial && (
        <>
          <label>
            Motivo de perda (se LOST)
            <input name="lostReason" />
          </label>
          <label>
            Nota
            <textarea name="note" />
          </label>
        </>
      )}
      {error && <p className="sa-error">{error}</p>}
      {ok && <p className="sa-ok">{ok}</p>}
      <button className="btn btn-primary" type="submit">
        Salvar
      </button>
    </form>
  );
}
