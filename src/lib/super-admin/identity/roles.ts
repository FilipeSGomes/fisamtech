import { adminQuery } from "@/lib/db";
import { writeAudit } from "@/lib/super-admin/audit/write";

export async function listRolesWithPermissions() {
  const roles = await adminQuery<{
    id: string;
    code: string;
    name: string;
    description: string;
  }>(`select id, code, name, description from admin_roles order by code`);

  const permissions = await adminQuery<{
    id: string;
    code: string;
    description: string;
  }>(`select id, code, description from admin_permissions order by code`);

  const links = await adminQuery<{ role_id: string; permission_id: string }>(
    `select role_id, permission_id from admin_role_permissions`
  );

  const byRole = new Map<string, string[]>();
  for (const link of links.rows) {
    const list = byRole.get(link.role_id) || [];
    list.push(link.permission_id);
    byRole.set(link.role_id, list);
  }

  return {
    roles: roles.rows.map((role) => ({
      ...role,
      permissionIds: byRole.get(role.id) || [],
    })),
    permissions: permissions.rows,
  };
}

export async function setRolePermissions(opts: {
  roleCode: string;
  permissionCodes: string[];
  actorUserId: string;
}): Promise<void> {
  if (opts.roleCode === "SUPER_ADMIN") {
    throw new Error("Papel SUPER_ADMIN é imutável");
  }
  const role = await adminQuery<{ id: string }>(
    `select id from admin_roles where code = $1`,
    [opts.roleCode]
  );
  if (!role.rows[0]) throw new Error("Papel não encontrado");
  const roleId = role.rows[0].id;
  await adminQuery(`delete from admin_role_permissions where role_id = $1`, [
    roleId,
  ]);
  for (const code of opts.permissionCodes) {
    await adminQuery(
      `insert into admin_role_permissions (role_id, permission_id)
       select $1, id from admin_permissions where code = $2`,
      [roleId, code]
    );
  }
  await writeAudit({
    action: "ROLE_PERMISSIONS_UPDATED",
    actorUserId: opts.actorUserId,
    resourceType: "admin_role",
    resourceId: roleId,
    context: { role: opts.roleCode, permissions: opts.permissionCodes },
  });
}
