"use client";

import { FormEvent, useMemo, useState } from "react";

type ValidateResult = {
  valid: boolean;
  authenticityCode?: string;
  signerName?: string | null;
  signerEmail?: string | null;
  signedAt?: string | null;
  proposalNumber?: string | null;
  proposalTitle?: string | null;
  version?: number | null;
  error?: string;
};

function formatSignedAt(value: string | null | undefined): string {
  if (!value) return "—";
  try {
    return new Intl.DateTimeFormat("pt-BR", {
      timeZone: "America/Sao_Paulo",
      dateStyle: "short",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

export function SignatureValidateForm({
  initialCode = "",
}: {
  initialCode?: string;
}) {
  const [code, setCode] = useState(initialCode);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ValidateResult | null>(null);

  const prefilled = useMemo(() => Boolean(initialCode.trim()), [initialCode]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setResult(null);
    try {
      const res = await fetch(
        `/api/public/signatures/validate?code=${encodeURIComponent(code.trim())}`
      );
      const data = (await res.json()) as ValidateResult;
      if (!res.ok && data.error) {
        setResult({ valid: false, error: data.error });
        return;
      }
      setResult(data);
    } catch {
      setResult({ valid: false, error: "Falha de rede ao validar" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="signature-validate">
      <form className="signature-validate-form" onSubmit={onSubmit}>
        <label>
          Código de autenticidade
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="Ex.: A1B2C3D4E5F6G7H8"
            autoComplete="off"
            spellCheck={false}
            required
            minLength={8}
            maxLength={64}
          />
        </label>
        <button className="btn btn-primary" type="submit" disabled={busy}>
          {busy ? "Validando…" : "Validar"}
        </button>
      </form>

      {prefilled && !result ? (
        <p className="muted">Código pré-preenchido — clique em Validar.</p>
      ) : null}

      {result?.error ? <p className="sa-error">{result.error}</p> : null}

      {result && !result.error ? (
        <div
          className={
            result.valid
              ? "signature-validate-result is-valid"
              : "signature-validate-result is-invalid"
          }
        >
          {result.valid ? (
            <>
              <p>
                <strong>Assinatura válida</strong>
              </p>
              <dl>
                <div>
                  <dt>Código</dt>
                  <dd className="sa-mono">{result.authenticityCode}</dd>
                </div>
                <div>
                  <dt>Signatário</dt>
                  <dd>{result.signerName || "—"}</dd>
                </div>
                <div>
                  <dt>E-mail</dt>
                  <dd>{result.signerEmail || "—"}</dd>
                </div>
                <div>
                  <dt>Assinado em</dt>
                  <dd>{formatSignedAt(result.signedAt)}</dd>
                </div>
                <div>
                  <dt>Proposta</dt>
                  <dd>
                    {result.proposalNumber || "—"}
                    {result.version != null ? ` · v${result.version}` : ""}
                    {result.proposalTitle ? ` — ${result.proposalTitle}` : ""}
                  </dd>
                </div>
              </dl>
            </>
          ) : (
            <p>
              <strong>Código não encontrado</strong>
              <span className="muted">
                {" "}
                — verifique o código impresso no PDF da proposta.
              </span>
            </p>
          )}
        </div>
      ) : null}
    </div>
  );
}
