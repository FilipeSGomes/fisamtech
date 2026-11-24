import { getAdminSessionFromCookies } from "@/lib/super-admin/auth/session";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const session = await getAdminSessionFromCookies();

  return (
    <div className="sa-page">
      <h1>Configurações</h1>
      <p className="muted">Sessão atual e status de autenticação.</p>

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
      </div>
    </div>
  );
}
