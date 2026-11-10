"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const NAV = [
  { href: "/pt-br/super-admin/dashboard", label: "Dashboard" },
  { href: "/pt-br/super-admin/leads", label: "Leads" },
  { href: "/pt-br/super-admin/companies", label: "Empresas" },
  { href: "/pt-br/super-admin/contacts", label: "Contatos" },
  { href: "/pt-br/super-admin/opportunities", label: "Oportunidades" },
  { href: "/pt-br/super-admin/proposals", label: "Propostas" },
  { href: "/pt-br/super-admin/users", label: "Usuários" },
  { href: "/pt-br/super-admin/roles", label: "Papéis" },
  { href: "/pt-br/super-admin/audit", label: "Auditoria" },
  { href: "/pt-br/super-admin/settings", label: "Configurações" },
];

export function AdminShell({
  userName,
  children,
}: {
  userName: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch("/api/admin/auth/logout", { method: "POST" });
    router.push("/pt-br/super-admin/login");
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
          {NAV.map((item) => {
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
