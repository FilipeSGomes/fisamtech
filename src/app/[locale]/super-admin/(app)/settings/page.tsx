import { getAdminSessionFromCookies } from "@/lib/super-admin/auth/session";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const session = await getAdminSessionFromCookies();

  return (
    <div className="sa-page">
      <h1>Configurações</h1>
      <p className="muted">Sessão atual e referências operacionais.</p>

      <div className="sa-panels">
        <section className="sa-panel">
          <h2>Sessão</h2>
          <dl className="sa-dl">
            <div>
              <dt>Usuário</dt>
              <dd>{session?.name}</dd>
            </div>
            <div>
              <dt>E-mail</dt>
              <dd>{session?.email}</dd>
            </div>
            <div>
              <dt>Papéis</dt>
              <dd>{session?.roles.join(", ") || "—"}</dd>
            </div>
            <div>
              <dt>MFA</dt>
              <dd>
                {session?.mfaEnabled
                  ? session.mfaVerified
                    ? "Ativo e verificado nesta sessão"
                    : "Ativo (pendente nesta sessão)"
                  : "Não ativado"}
              </dd>
            </div>
            <div>
              <dt>Session ID</dt>
              <dd className="sa-mono">{session?.sessionId}</dd>
            </div>
          </dl>
          {!session?.mfaEnabled && session?.roles.includes("SUPER_ADMIN") ? (
            <p>
              <a href="/pt-br/super-admin/mfa">Ativar MFA agora</a>
            </p>
          ) : null}
        </section>

        <section className="sa-panel">
          <h2>Operações</h2>
          <ul className="sa-list">
            <li>
              <span>Bootstrap do primeiro admin</span>
              <code>npm run admin:bootstrap</code>
            </li>
            <li>
              <span>Documentação</span>
              <a href="/docs/super-admin/deployment.md">docs/super-admin/</a>
            </li>
            <li>
              <span>PDF letterhead</span>
              <code>private/branding/papel-timbrado-fisam-tech.png</code>
            </li>
            <li>
              <span>PDFs de propostas</span>
              <code>private/proposals/</code>
            </li>
          </ul>
          <p className="muted">
            Variáveis: <code>DATABASE_URL</code>, <code>ADMIN_SESSION_SECRET</code>,{" "}
            <code>RESEND_API_KEY</code> (envio real), bootstrap via{" "}
            <code>ADMIN_BOOTSTRAP_*</code>.
          </p>
        </section>
      </div>
    </div>
  );
}
