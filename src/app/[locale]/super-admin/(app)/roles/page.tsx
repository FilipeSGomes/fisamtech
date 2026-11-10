import { RolesManager } from "@/components/super-admin/RolesManager";
import { getAdminSessionFromCookies } from "@/lib/super-admin/auth/session";
import { listRolesWithPermissions } from "@/lib/super-admin/identity/roles";
import { hasPermission } from "@/lib/super-admin/rbac/authorize";

export const dynamic = "force-dynamic";

export default async function RolesPage() {
  const [data, session] = await Promise.all([
    listRolesWithPermissions(),
    getAdminSessionFromCookies(),
  ]);
  const canManage = hasPermission(session, "roles:manage");

  return (
    <div className="sa-page">
      <h1>Papéis e permissões</h1>
      <p className="muted">
        {canManage
          ? "Você pode alterar permissões (exceto SUPER_ADMIN)."
          : "Somente leitura — roles:manage necessário para editar."}
      </p>
      <RolesManager
        roles={data.roles}
        permissions={data.permissions}
        canManage={canManage}
      />
    </div>
  );
}
