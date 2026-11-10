"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function SuperAdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [totp, setTotp] = useState("");
  const [needsTotp, setNeedsTotp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
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

  return (
    <div className="sa-login">
      <form className="sa-login-card form" onSubmit={onSubmit}>
        <p className="sa-login-eyebrow">FISAM TECH</p>
        <h1>Super Admin</h1>
        <p className="muted">Acesso interno à operação comercial.</p>
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
        {error && (
          <p role="alert" className="sa-error">
            {error}
          </p>
        )}
        <button className="btn btn-primary" type="submit" disabled={loading}>
          {loading ? "…" : "Entrar"}
        </button>
      </form>
    </div>
  );
}
