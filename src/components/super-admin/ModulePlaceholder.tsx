export function ModulePlaceholder({
  title,
  phase,
  summary,
}: {
  title: string;
  phase: string;
  summary: string;
}) {
  return (
    <div className="sa-page">
      <h1>{title}</h1>
      <p className="muted">{summary}</p>
      <div className="sa-panel">
        <p>
          Módulo previsto na <strong>{phase}</strong>. A fundação (schema, IAM e
          APIs) já está preparada; a UI operacional completa entra na entrega
          incremental seguinte.
        </p>
      </div>
    </div>
  );
}
