import { DocumentSigner } from "@/components/super-admin/DocumentSigner";
import { requireAdminPage } from "@/lib/super-admin/rbac/page-gate";
import { listSignedDocuments } from "@/lib/super-admin/signing/sign-document";

export const dynamic = "force-dynamic";

export default async function AssinarDocumentosPage() {
  const user = await requireAdminPage("documents:sign");
  const items = await listSignedDocuments({ limit: 50 });

  return (
    <div className="sa-page">
      <div className="sa-page-head">
        <div>
          <h1>Assinar documentos</h1>
          <p className="muted">
            Envie um PDF, confirme com o código MFA do autenticador e gere o
            certificado com código de autenticidade consultável publicamente.
          </p>
        </div>
      </div>
      <DocumentSigner
        userName={user.name}
        mfaEnabled={user.mfaEnabled}
        mfaVerified={user.mfaVerified}
        initialItems={items.map((item) => ({
          id: item.id,
          title: item.title,
          originalFilename: item.originalFilename,
          authenticityCode: item.authenticityCode,
          signerName: item.signerName,
          signedAt: item.signedAt,
        }))}
      />
    </div>
  );
}
