"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const SA_BASE = "/pt-br/super-admin";

type NavItem = {
  href: string;
  label: string;
  /** Permission required; omit for always-visible (settings). */
  permission?: string;
};

const NAV: NavItem[] = [
  { href: `${SA_BASE}/dashboard`, label: "Dashboard", permission: "dashboard:read" },
  { href: `${SA_BASE}/leads`, label: "Leads", permission: "leads:read" },
  { href: `${SA_BASE}/companies`, label: "Empresas", permission: "companies:read" },
  { href: `${SA_BASE}/contacts`, label: "Contatos", permission: "contacts:read" },
  {
    href: `${SA_BASE}/opportunities`,
    label: "Oportunidades",
    permission: "opportunities:read",
  },
  { href: `${SA_BASE}/proposals`, label: "Propostas", permission: "proposals:read" },
  { href: `${SA_BASE}/ndas`, label: "NDAs", permission: "ndas:read" },
  { href: `${SA_BASE}/contracts`, label: "Contratos", permission: "contracts:read" },
  { href: `${SA_BASE}/users`, label: "Usuários", permission: "users:read" },
  { href: `${SA_BASE}/roles`, label: "Papéis", permission: "users:read" },
  { href: `${SA_BASE}/audit`, label: "Auditoria", permission: "audit:read" },
  { href: `${SA_BASE}/settings`, label: "Configurações" },
];

function canSeeNavItem(
  item: NavItem,
  permissions: string[],
  roles: string[]
): boolean {
  if (!item.permission) return true;
  if (roles.includes("SUPER_ADMIN")) return true;
  return permissions.includes(item.permission);
}

export function AdminShell({
  userName,
  permissions = [],
  roles = [],
  children,
}: {
  userName: string;
  permissions?: string[];
  roles?: string[];
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const links = NAV.filter((item) => canSeeNavItem(item, permissions, roles));

  async function logout() {
    await fetch("/api/admin/auth/logout", { method: "POST" });
    router.push(`${SA_BASE}/login`);
    router.refresh();
  }

  return (
    <div className="sa-shell">
      <aside className="sa-sidebar">
        <div className="sa-brand">
          <span className="sa-brand-mark">FISAM</span>
          <span className="sa-brand-sub">Super Admin</span>
        </div>
        <nav className="sa-nav">
          {links.map((item) => {
            const active = pathname?.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={active ? "sa-nav-link is-active" : "sa-nav-link"}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>
      <div className="sa-main">
        <header className="sa-topbar">
          <div className="sa-topbar-title">Operação comercial</div>
          <div className="sa-topbar-user">
            <span>{userName}</span>
            <button type="button" className="sa-btn sa-btn-ghost" onClick={logout}>
              Sair
            </button>
          </div>
        </header>
        <main className="sa-content">{children}</main>
      </div>
    </div>
  );
}
