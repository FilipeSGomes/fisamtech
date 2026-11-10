"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export function UsersManager({
  users,
  roleCodes,
}: {
  users: Array<{
    id: string;
    email: string;
    name: string;
    status: string;
    mfa_enabled: boolean;
    roles: string[];
  }>;
  roleCodes: string[];
}) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [inviteToken, setInviteToken] = useState<string | null>(null);

  async function invite(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setInviteToken(null);
    const fd = new FormData(e.currentTarget);
    const roleCodesSelected = roleCodes.filter((code) => fd.get(`role_${code}`));
    const res = await fetch("/api/admin/users/invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: String(fd.get("email") || ""),
        roleCodes: roleCodesSelected.length ? roleCodesSelected : ["SALES"],
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Falha ao convidar");
      return;
    }
    setMessage(`Convite criado. Expira em ${new Date(data.expiresAt).toLocaleString("pt-BR")}`);
    setInviteToken(data.token);
    router.refresh();
  }

  async function toggleStatus(userId: string, status: "active" | "disabled") {
    setError(null);
    const res = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, status }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Falha ao atualizar");
      return;
    }
    router.refresh();
  }

  async function revokeSessions(userId: string) {
    setError(null);
    const res = await fetch(`/api/admin/users/${userId}/sessions`, {
      method: "DELETE",
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Falha ao revogar");
      return;
    }
    setMessage(`${data.revoked} sessão(ões) revogada(s)`);
  }

  async function saveRoles(userId: string, form: HTMLFormElement) {
    const fd = new FormData(form);
    const selected = roleCodes.filter((code) => fd.get(`u_${userId}_${code}`));
    const res = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, roleCodes: selected }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Falha ao salvar papéis");
      return;
    }
    setMessage("Papéis atualizados");
    router.refresh();
  }

  return (
    <div className="sa-panels" style={{ gridTemplateColumns: "1fr" }}>
      <form className="sa-panel form" onSubmit={invite}>
        <h2>Convidar usuário</h2>
        <label>
          E-mail
          <input name="email" type="email" required />
        </label>
        <div className="sa-filters">
          {roleCodes.map((code) => (
            <label key={code}>
              <input type="checkbox" name={`role_${code}`} defaultChecked={code === "SALES"} />{" "}
              {code}
            </label>
          ))}
        </div>
        <button className="btn btn-primary" type="submit">
          Gerar convite
        </button>
        {inviteToken && (
          <p className="sa-mono">
            Token (copie agora): {inviteToken}
            <br />
            Aceite: /pt-br/super-admin/login?invite=…
          </p>
        )}
      </form>

      {error && <p className="sa-error">{error}</p>}
      {message && <p className="sa-ok">{message}</p>}

      <div className="sa-table-wrap">
        <table className="sa-table">
          <thead>
            <tr>
              <th>Usuário</th>
              <th>Status</th>
              <th>MFA</th>
              <th>Papéis</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>
                  <strong>{u.name}</strong>
                  <div className="muted">{u.email}</div>
                </td>
                <td>{u.status}</td>
                <td>{u.mfa_enabled ? "sim" : "não"}</td>
                <td>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      saveRoles(u.id, e.currentTarget);
                    }}
                  >
                    <div className="sa-filters">
                      {roleCodes.map((code) => (
                        <label key={code}>
                          <input
                            type="checkbox"
                            name={`u_${u.id}_${code}`}
                            defaultChecked={u.roles.includes(code)}
                          />{" "}
                          {code}
                        </label>
                      ))}
                    </div>
                    <button className="btn btn-secondary" type="submit">
                      Salvar papéis
                    </button>
                  </form>
                </td>
                <td>
                  <div className="sa-filters">
                    {u.status === "active" ? (
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => toggleStatus(u.id, "disabled")}
                      >
                        Desativar
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => toggleStatus(u.id, "active")}
                      >
                        Reativar
                      </button>
                    )}
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => revokeSessions(u.id)}
                    >
                      Revogar sessões
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
