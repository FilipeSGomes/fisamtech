"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

export function RolesManager({
  roles,
  permissions,
  canManage,
}: {
  roles: Array<{
    id: string;
    code: string;
    name: string;
    description: string;
    permissionIds: string[];
  }>;
  permissions: Array<{ id: string; code: string; description: string }>;
  canManage: boolean;
}) {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState(roles[0]?.code || "");
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const role = useMemo(
    () => roles.find((r) => r.code === selectedRole),
    [roles, selectedRole]
  );

  const [checked, setChecked] = useState<Record<string, boolean>>(() => {
    const map: Record<string, boolean> = {};
    for (const p of permissions) {
      map[p.code] = role?.permissionIds.includes(p.id) || false;
    }
    return map;
  });

  function selectRole(code: string) {
    setSelectedRole(code);
    const next = roles.find((r) => r.code === code);
    const map: Record<string, boolean> = {};
    for (const p of permissions) {
      map[p.code] = next?.permissionIds.includes(p.id) || false;
    }
    setChecked(map);
    setError(null);
    setOk(null);
  }

  async function save() {
    if (!canManage) return;
    setError(null);
    setOk(null);
    const permissionCodes = Object.entries(checked)
      .filter(([, v]) => v)
      .map(([k]) => k);
    const res = await fetch("/api/admin/roles", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roleCode: selectedRole, permissionCodes }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Falha ao salvar");
      return;
    }
    setOk("Permissões atualizadas");
    router.refresh();
  }

  return (
    <div className="sa-panels">
      <section className="sa-panel">
        <h2>Papéis</h2>
        <ul className="sa-list">
          {roles.map((r) => (
            <li key={r.id}>
              <button
                type="button"
                className={r.code === selectedRole ? "sa-nav-link is-active" : "sa-nav-link"}
                onClick={() => selectRole(r.code)}
              >
                {r.code}
              </button>
              <span className="muted">{r.name}</span>
            </li>
          ))}
        </ul>
      </section>
      <section className="sa-panel">
        <h2>Permissões — {selectedRole}</h2>
        {selectedRole === "SUPER_ADMIN" && (
          <p className="muted">SUPER_ADMIN é imutável (todas as permissões).</p>
        )}
        <div className="sa-list">
          {permissions.map((p) => (
            <label key={p.id}>
              <input
                type="checkbox"
                disabled={!canManage || selectedRole === "SUPER_ADMIN"}
                checked={Boolean(checked[p.code])}
                onChange={(e) =>
                  setChecked({ ...checked, [p.code]: e.target.checked })
                }
              />{" "}
              <code>{p.code}</code> — {p.description}
            </label>
          ))}
        </div>
        {canManage && selectedRole !== "SUPER_ADMIN" && (
          <button className="btn btn-primary" type="button" onClick={save}>
            Salvar permissões
          </button>
        )}
        {error && <p className="sa-error">{error}</p>}
        {ok && <p className="sa-ok">{ok}</p>}
      </section>
    </div>
  );
}
