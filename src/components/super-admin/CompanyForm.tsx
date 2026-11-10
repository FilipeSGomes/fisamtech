"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export function CompanyForm({
  initial,
}: {
  initial?: {
    id: string;
    legal_name: string;
    trade_name: string | null;
    tax_id: string | null;
    country: string | null;
    website: string | null;
    notes: string | null;
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
    const payload = {
      legalName: String(fd.get("legalName") || ""),
      tradeName: String(fd.get("tradeName") || "") || null,
      taxId: String(fd.get("taxId") || "") || null,
      country: String(fd.get("country") || "") || null,
      website: String(fd.get("website") || "") || null,
      notes: String(fd.get("notes") || "") || null,
    };
    const res = await fetch(
      initial ? `/api/admin/companies/${initial.id}` : "/api/admin/companies",
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
      router.push(`/pt-br/super-admin/companies?highlight=${data.id}`);
    }
  }

  return (
    <form className="sa-panel form" onSubmit={onSubmit}>
      <h2>{initial ? "Editar empresa" : "Nova empresa"}</h2>
      <label>
        Razão social
        <input name="legalName" required defaultValue={initial?.legal_name || ""} />
      </label>
      <label>
        Nome fantasia
        <input name="tradeName" defaultValue={initial?.trade_name || ""} />
      </label>
      <label>
        CNPJ / Tax ID
        <input name="taxId" defaultValue={initial?.tax_id || ""} />
      </label>
      <label>
        País
        <input name="country" defaultValue={initial?.country || "BR"} />
      </label>
      <label>
        Website
        <input name="website" defaultValue={initial?.website || ""} />
      </label>
      <label>
        Notas
        <textarea name="notes" defaultValue={initial?.notes || ""} />
      </label>
      {error && <p className="sa-error">{error}</p>}
      {ok && <p className="sa-ok">{ok}</p>}
      <button className="btn btn-primary" type="submit">
        Salvar
      </button>
    </form>
  );
}
