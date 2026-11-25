"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function LeadRowActions({
  leadId,
  archived,
  canDelete,
}: {
  leadId: string;
  archived: boolean;
  canDelete: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function setArchived(nextArchived: boolean) {
    const prompt = nextArchived
      ? "Desativar este lead? Ele será removido da lista ativa, mas poderá ser restaurado."
      : "Reativar este lead?";
    if (!window.confirm(prompt)) return;
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/leads/${leadId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ archived: nextArchived }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Não foi possível atualizar o lead.");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível atualizar o lead.");
    } finally {
      setBusy(false);
    }
  }

  async function deletePermanently() {
    const confirmed = window.confirm(
      "Excluir este lead definitivamente? Esta ação não pode ser desfeita e remove o histórico de atividades do CRM. Leads com pagamentos ou reservas vinculados não podem ser excluídos."
    );
    if (!confirmed) return;
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/leads/${leadId}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Não foi possível excluir o lead.");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível excluir o lead.");
    } finally {
      setBusy(false);
    }
  }

  if (!canDelete) return null;

  return (
    <div>
      {archived ? (
        <>
          <button className="btn" type="button" disabled={busy} onClick={() => setArchived(false)}>
            Reativar
          </button>{" "}
          <button className="btn" type="button" disabled={busy} onClick={deletePermanently}>
            Excluir definitivamente
          </button>
        </>
      ) : (
        <button className="btn" type="button" disabled={busy} onClick={() => setArchived(true)}>
          Desativar
        </button>
      )}
      {error ? <p className="sa-error">{error}</p> : null}
    </div>
  );
}
