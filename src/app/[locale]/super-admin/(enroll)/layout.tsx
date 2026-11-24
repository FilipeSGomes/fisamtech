import { redirect } from "next/navigation";
import { AdminShell } from "@/components/super-admin/AdminShell";
import { getAdminSessionFromCookies } from "@/lib/super-admin/auth/session";

export const dynamic = "force-dynamic";

/** MFA enrollment only — not subject to the (app) MFA hard gate. */
export default async function SuperAdminEnrollLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (locale !== "pt-br") {
    redirect("/pt-br/super-admin/mfa");
  }

  const session = await getAdminSessionFromCookies();
  if (!session) {
    redirect("/pt-br/super-admin/login");
  }

  if (session.mfaEnabled) {
    redirect("/pt-br/super-admin/dashboard");
  }

  return (
    <AdminShell
      userName={session.name}
      permissions={[]}
      roles={[]}
    >
      <div className="sa-banner">
        MFA obrigatório para Super Admin. Conclua a ativação para continuar.
      </div>
      {children}
    </AdminShell>
  );
}
