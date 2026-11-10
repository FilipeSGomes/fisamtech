"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export function ContactForm({
  companies,
  initial,
}: {
  companies: Array<{ id: string; legal_name: string }>;
  initial?: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    role_title: string | null;
    company_id: string | null;
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
      name: String(fd.get("name") || ""),
      email: String(fd.get("email") || "") || null,
      phone: String(fd.get("phone") || "") || null,
      roleTitle: String(fd.get("roleTitle") || "") || null,
      companyId: String(fd.get("companyId") || "") || null,
      notes: String(fd.get("notes") || "") || null,
    };
    const res = await fetch(
      initial ? `/api/admin/contacts/${initial.id}` : "/api/admin/contacts",
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
  }

  return (
    <form className="sa-panel form" onSubmit={onSubmit}>
      <h2>{initial ? "Editar contato" : "Novo contato"}</h2>
      <label>
        Nome
        <input name="name" required defaultValue={initial?.name || ""} />
      </label>
      <label>
        E-mail
        <input name="email" type="email" defaultValue={initial?.email || ""} />
      </label>
      <label>
        Telefone
        <input name="phone" defaultValue={initial?.phone || ""} />
      </label>
      <label>
        Cargo
        <input name="roleTitle" defaultValue={initial?.role_title || ""} />
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
