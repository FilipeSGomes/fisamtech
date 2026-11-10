"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function SuperAdminLoginPage() {
  const router = useRouter();
  const [inviteToken, setInviteToken] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [totp, setTotp] = useState("");
  const [needsTotp, setNeedsTotp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"login" | "invite">("login");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const invite = params.get("invite") || "";
    if (invite) {
      setInviteToken(invite);
      setMode("invite");
    }
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (mode === "invite") {
        const res = await fetch("/api/admin/users/accept-invite", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            token: inviteToken,
            name,
            password,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Falha ao aceitar convite");
        setMode("login");
        setError(null);
        setPassword("");
        setOkMessage("Conta criada. Faça login com seu e-mail.");
        return;
      }

      const res = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          totp: totp || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.requiresTotp) setNeedsTotp(true);
        throw new Error(data.error || "Falha no login");
      }
      if (data.requiresMfaSetup) {
        router.push("/pt-br/super-admin/mfa");
      } else {
        router.push("/pt-br/super-admin/dashboard");
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro");
    } finally {
      setLoading(false);
    }
  }

  const [okMessage, setOkMessage] = useState<string | null>(null);

  return (
    <div className="sa-login">
      <form className="sa-login-card form" onSubmit={onSubmit}>
        <p className="sa-login-eyebrow">FISAM TECH</p>
        <h1>Super Admin</h1>
        <p className="muted">
          {mode === "invite"
            ? "Aceitar convite e definir senha."
            : "Acesso interno à operação comercial."}
        </p>

        {mode === "invite" ? (
          <>
            <label>
              Nome
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </label>
            <label>
              Nova senha (≥12)
              <input
                type="password"
                required
                minLength={12}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>
          </>
        ) : (
          <>
            <label>
              E-mail
              <input
                type="email"
                autoComplete="username"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>
            <label>
              Senha
              <input
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>
            {(needsTotp || totp) && (
              <label>
                Código MFA
                <input
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  value={totp}
                  onChange={(e) => setTotp(e.target.value)}
                />
              </label>
            )}
          </>
        )}

        {error && (
          <p role="alert" className="sa-error">
            {error}
          </p>
        )}
        {okMessage && <p className="sa-ok">{okMessage}</p>}
        <button className="btn btn-primary" type="submit" disabled={loading}>
          {loading ? "…" : mode === "invite" ? "Criar conta" : "Entrar"}
        </button>
        {inviteToken && mode === "login" && (
          <button
            type="button"
            className="sa-btn sa-btn-ghost"
            onClick={() => setMode("invite")}
          >
            Aceitar convite
          </button>
        )}
      </form>
    </div>
  );
}
