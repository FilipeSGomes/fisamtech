import { UsersManager } from "@/components/super-admin/UsersManager";
import { listAdminUsers } from "@/lib/super-admin/identity/users";
import { listRolesWithPermissions } from "@/lib/super-admin/identity/roles";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const [users, rolesData] = await Promise.all([
    listAdminUsers({ pageSize: 100 }),
    listRolesWithPermissions(),
  ]);

  return (
    <div className="sa-page">
      <h1>Usuários</h1>
      <p className="muted">Convites, papéis, desativação e revogação de sessões.</p>
      <UsersManager
        users={users.items}
        roleCodes={rolesData.roles.map((r) => r.code)}
      />
    </div>
  );
}
