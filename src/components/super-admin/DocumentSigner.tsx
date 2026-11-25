"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";

type SignSuccess = {
  documentId: string;
  authenticityCode: string;
  signedAt: string;
  downloadUrls: { pdf: string; certificate: string };
  validateUrl: string;
};

type ListedDoc = {
  id: string;
  title: string;
  originalFilename: string;
  authenticityCode: string;
  signerName: string;
  signedAt: string;
};

function formatWhen(iso: string) {
  try {
    return new Intl.DateTimeFormat("pt-BR", {
      timeZone: "America/Sao_Paulo",
      dateStyle: "short",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function DocumentSigner({
  initialItems,
  userName,
  mfaEnabled,
  mfaVerified,
}: {
  initialItems: ListedDoc[];
  userName: string;
  mfaEnabled: boolean;
  mfaVerified: boolean;
}) {
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [totp, setTotp] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<SignSuccess | null>(null);
  const [items, setItems] = useState(initialItems);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!file) {
      setError("Selecione um PDF");
      return;
    }
    if (!mfaEnabled) {
      setError("Ative o MFA antes de assinar");
      return;
    }
    setBusy(true);
    try {
      const body = new FormData();
      body.set("title", title);
      body.set("totp", totp);
      body.set("file", file);
      const res = await fetch("/api/admin/documents/sign", {
        method: "POST",
        body,
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Falha ao assinar");
        return;
      }
      const signed = data as SignSuccess;
      setSuccess(signed);
      setTotp("");
      setFile(null);
      setItems((prev) => [
        {
          id: signed.documentId,
          title: title.trim(),
          originalFilename: file.name,
          authenticityCode: signed.authenticityCode,
          signerName: userName,
          signedAt: signed.signedAt,
        },
        ...prev,
      ]);
    } catch {
      setError("Falha de rede ao assinar");
    } finally {
      setBusy(false);
    }
  }

  if (!mfaEnabled) {
    return (
      <div className="sa-panel">
        <p>
          Ative o MFA para assinar documentos.{" "}
          <Link href="/pt-br/super-admin/mfa">Configurar MFA</Link>
        </p>
      </div>
    );
  }

  return (
    <div className="sa-document-signer">
      <form className="sa-panel form" onSubmit={onSubmit}>
        <p className="muted">
          Assinatura eletrônica interna com step-up MFA (código do autenticador).
          O código de autenticidade gerado é estável e diferente do TOTP — use-o
          em{" "}
          <Link href="/pt-br/validar-assinatura" target="_blank">
            /validar-assinatura
          </Link>
          .
          {!mfaVerified ? (
            <>
              {" "}
              Sua sessão ainda não está marcada como MFA verificada; o TOTP abaixo
              confirma a assinatura.
            </>
          ) : null}
        </p>

        <label>
          Título do documento
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            maxLength={200}
            placeholder="Ex.: Contrato de prestação — Cliente X"
          />
        </label>

        <label>
          Arquivo PDF
          <input
            type="file"
            accept="application/pdf,.pdf"
            required
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
        </label>

        <label>
          Código MFA (app autenticador)
          <input
            value={totp}
            onChange={(e) => setTotp(e.target.value.replace(/\D/g, "").slice(0, 6))}
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="\d{6}"
            minLength={6}
            maxLength={6}
            required
            placeholder="6 dígitos"
          />
        </label>

        {error ? <p className="sa-error" role="alert">{error}</p> : null}

        <div className="sa-proposal-actions">
          <button className="btn btn-primary" type="submit" disabled={busy}>
            {busy ? "Assinando…" : `Assinar como ${userName}`}
          </button>
        </div>
      </form>

      {success ? (
        <div className="sa-panel sa-proposal-auth-code">
          <p>
            <strong>Documento assinado</strong>
          </p>
          <p>
            Código de autenticidade:{" "}
            <code className="sa-mono">{success.authenticityCode}</code>
          </p>
          <div className="sa-proposal-actions">
            <a className="btn" href={success.downloadUrls.pdf}>
              Baixar PDF assinado
            </a>
            <a className="btn" href={success.downloadUrls.certificate}>
              Baixar certificado
            </a>
            <Link className="btn btn-primary" href={success.validateUrl} target="_blank">
              Validar assinatura
            </Link>
          </div>
        </div>
      ) : null}

      <div className="sa-panel">
        <h2>Documentos recentes</h2>
        {items.length === 0 ? (
          <p className="muted">Nenhum documento assinado ainda.</p>
        ) : (
          <div className="sa-table-wrap">
            <table className="sa-table">
              <thead>
                <tr>
                  <th>Título</th>
                  <th>Código</th>
                  <th>Quando</th>
                  <th>Arquivos</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <strong>{item.title}</strong>
                      <div className="muted">{item.originalFilename}</div>
                    </td>
                    <td>
                      <code className="sa-mono">{item.authenticityCode}</code>
                    </td>
                    <td>{formatWhen(item.signedAt)}</td>
                    <td>
                      <a href={`/api/admin/documents/${item.id}/pdf`}>PDF</a>
                      {" · "}
                      <a href={`/api/admin/documents/${item.id}/certificate`}>
                        Certificado
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
