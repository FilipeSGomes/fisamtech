"use client";

export default function SuperAdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="sa-page">
      <h1>Algo deu errado</h1>
      <p className="sa-error">
        {error.message || "Falha ao carregar esta página."}
      </p>
      <button type="button" className="btn btn-primary" onClick={reset}>
        Tentar novamente
      </button>
    </div>
  );
}
