import { redirect } from "next/navigation";
import { AdminShell } from "@/components/super-admin/AdminShell";
import { getAdminSessionFromCookies } from "@/lib/super-admin/auth/session";

export const dynamic = "force-dynamic";

export default async function SuperAdminAppLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (locale !== "pt-br") {
    redirect("/pt-br/super-admin/dashboard");
  }

  const session = await getAdminSessionFromCookies();
  if (!session) {
    redirect("/pt-br/super-admin/login");
  }

  if (session.roles.includes("SUPER_ADMIN") && !session.mfaEnabled) {
    redirect("/pt-br/super-admin/mfa");
  }

  return (
    <AdminShell
      userName={session.name}
      permissions={session.permissions}
      roles={session.roles}
    >
      {children}
    </AdminShell>
  );
}
