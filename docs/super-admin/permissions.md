# Super Admin — Permissions

## Roles

| Code | Description |
|---|---|
| `SUPER_ADMIN` | Full control |
| `ADMIN` | Operational administration |
| `SALES` | CRM + proposals (create/send) |
| `FINANCE` | Read commercial/financial views |
| `VIEWER` | Read-only |

## Permission codes

```text
leads:read leads:create leads:update leads:delete leads:export
companies:read companies:create companies:update
contacts:read contacts:create contacts:update
opportunities:read opportunities:create opportunities:update
proposals:read proposals:create proposals:update proposals:approve proposals:send proposals:export
users:read users:invite users:update users:disable
roles:manage
audit:read
settings:manage
dashboard:read
```

Effective permissions = union of role permissions. Checked in API handlers via `requirePermission(session, code)`.

Resource-level rules (owner vs global) apply for SALES on opportunities/proposals; SUPER_ADMIN/ADMIN bypass owner scope.
