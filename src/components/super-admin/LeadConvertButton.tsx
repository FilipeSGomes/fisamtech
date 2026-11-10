"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function LeadConvertButton({ leadId }: { leadId: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function convert() {
    setLoading(true);
    setError(null);
    const res = await fetch(`/api/admin/leads/${leadId}/convert`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Falha na conversão");
      return;
    }
    router.push(`/pt-br/super-admin/opportunities`);
    router.refresh();
  }

  return (
    <div>
      <button
        type="button"
        className="btn btn-primary"
        onClick={convert}
        disabled={loading}
      >
        {loading ? "Convertendo…" : "Converter em oportunidade"}
      </button>
      {error && <p className="sa-error">{error}</p>}
    </div>
  );
}
