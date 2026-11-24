"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function MfaSetupPage() {
  const router = useRouter();
  const [secret, setSecret] = useState("");
  const [otpauthUrl, setOtpauthUrl] = useState("");
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [totp, setTotp] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/auth/mfa/setup")
      .then((r) => r.json())
      .then((data) => {
        if (data.secretBase32) {
          setSecret(data.secretBase32);
          setOtpauthUrl(data.otpauthUrl || "");
          setQrDataUrl(data.qrDataUrl || "");
        } else {
          setError(data.error || "Não foi possível iniciar MFA");
        }
      })
      .catch(() => setError("Falha ao carregar MFA"));
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch("/api/admin/auth/mfa/setup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ secretBase32: secret, totp }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Falha");
      return;
    }
    router.push("/pt-br/super-admin/dashboard");
    router.refresh();
  }

  return (
    <div className="sa-page">
      <h1>Ativar MFA</h1>
      <p className="muted">
        Obrigatório para Super Admin. Escaneie o QR Code no autenticador (Google
        Authenticator, 1Password, Authy) e confirme o código de 6 dígitos.
      </p>
      <form className="sa-panel form" onSubmit={onSubmit}>
        {qrDataUrl ? (
          <div className="sa-mfa-qr">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={qrDataUrl}
              alt="QR Code para configurar MFA no autenticador"
              width={240}
              height={240}
            />
            <p className="muted">Aponte a câmera do autenticador para este QR.</p>
          </div>
        ) : (
          !error && <p className="muted">Gerando QR Code…</p>
        )}
        {secret && (
          <details className="sa-mfa-manual">
            <summary>Não consegue escanear? Digite manualmente</summary>
            <p>
              Segredo: <code>{secret}</code>
            </p>
            {otpauthUrl && (
              <p className="sa-mono">
                URI: <code>{otpauthUrl}</code>
              </p>
            )}
          </details>
        )}
        <label>
          Código de 6 dígitos
          <input
            required
            inputMode="numeric"
            autoComplete="one-time-code"
            value={totp}
            onChange={(e) => setTotp(e.target.value)}
          />
        </label>
        {error && <p className="sa-error">{error}</p>}
        <button className="btn btn-primary" type="submit" disabled={!secret}>
          Confirmar MFA
        </button>
      </form>
    </div>
  );
}
