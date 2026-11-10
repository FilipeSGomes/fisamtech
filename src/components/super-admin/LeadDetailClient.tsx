"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import {
  LEAD_STATUS_LABELS,
  type LeadStatus,
} from "@/lib/super-admin/crm/lead-status";

export function LeadDetailClient({
  leadId,
  status,
}: {
  leadId: string;
  status: LeadStatus;
}) {
  const router = useRouter();
  const [nextStatus, setNextStatus] = useState(status);
  const [note, setNote] = useState("");
  const [lostReason, setLostReason] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function saveStatus(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    const res = await fetch(`/api/admin/leads/${leadId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: nextStatus,
        lostReason: nextStatus === "LOST" ? lostReason : undefined,
        note: note || undefined,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Falha ao salvar");
      return;
    }
    setMessage("Atualizado");
    setNote("");
    router.refresh();
  }

  return (
    <form className="sa-panel form" onSubmit={saveStatus}>
      <h2>Ações</h2>
      <label>
        Status
        <select
          value={nextStatus}
          onChange={(e) => setNextStatus(e.target.value as LeadStatus)}
        >
          {Object.entries(LEAD_STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>
      {nextStatus === "LOST" && (
        <label>
          Motivo da perda
          <input
            required
            value={lostReason}
            onChange={(e) => setLostReason(e.target.value)}
          />
        </label>
      )}
      <label>
        Nota interna
        <textarea value={note} onChange={(e) => setNote(e.target.value)} />
      </label>
      {error && <p className="sa-error">{error}</p>}
      {message && <p className="sa-ok">{message}</p>}
      <button className="btn btn-primary" type="submit">
        Salvar
      </button>
    </form>
  );
}
