import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { InstitutionalShell } from "@/components/layout/InstitutionalShell";
import { SignatureValidateForm } from "@/components/public/SignatureValidateForm";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return pageMetadata(
    locale,
    "Validar assinatura | FISAM TECH",
    "Confira a autenticidade de uma proposta assinada eletronicamente pela FISAM TECH.",
    "/validar-assinatura"
  );
}

export default async function ValidarAssinaturaPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const sp = await searchParams;
  const initialCode = typeof sp.code === "string" ? sp.code : "";

  return (
    <InstitutionalShell
      prose
      eyebrow="Autenticidade"
      title="Validar assinatura eletrônica"
      lead="Informe o código de autenticidade impresso no PDF da proposta para confirmar signatário, data e documento."
    >
      <SignatureValidateForm initialCode={initialCode} />
      <p className="muted">
        Esta consulta retorna apenas metadados públicos (signatário, data e
        identificação da proposta). O PDF não é disponibilizado por aqui.
      </p>
    </InstitutionalShell>
  );
}
