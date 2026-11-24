import { RolesManager } from "@/components/super-admin/RolesManager";
import { listRolesWithPermissions } from "@/lib/super-admin/identity/roles";
import { hasPermission } from "@/lib/super-admin/rbac/authorize";
import { requireAdminPage } from "@/lib/super-admin/rbac/page-gate";

export const dynamic = "force-dynamic";

export default async function RolesPage() {
  const session = await requireAdminPage("users:read");
  const data = await listRolesWithPermissions();
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
