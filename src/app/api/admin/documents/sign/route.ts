import { NextRequest, NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE } from "@/lib/super-admin/auth/session";
import {
  clientMeta,
  jsonError,
  requireAdminApi,
} from "@/lib/super-admin/http";
import { MfaStepUpError } from "@/lib/super-admin/signing/mfa-stepup";
import {
  MAX_SIGNED_PDF_BYTES,
  signDocument,
} from "@/lib/super-admin/signing/sign-document";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const user = await requireAdminApi(req, "documents:sign");
    const sessionToken = req.cookies.get(ADMIN_SESSION_COOKIE)?.value;
    if (!sessionToken) {
      return NextResponse.json({ error: "Sessão inválida" }, { status: 401 });
    }

    const form = await req.formData();
    const file = form.get("file");
    const title = String(form.get("title") || "");
    const totp = String(form.get("totp") || "");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "Envie o campo file com um PDF" },
        { status: 400 }
      );
    }
    if (file.size > MAX_SIGNED_PDF_BYTES) {
      return NextResponse.json(
        { error: "PDF acima do limite de 10 MB" },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const meta = clientMeta(req);
    const result = await signDocument({
      title,
      originalFilename: file.name || "documento.pdf",
      pdfBytes: buffer,
      totp,
      actorUserId: user.id,
      actorName: user.name,
      actorEmail: user.email,
      sessionToken,
      ip: meta.ip,
      userAgent: meta.userAgent,
    });

    return NextResponse.json({
      ...result,
      downloadUrls: {
        pdf: `/api/admin/documents/${result.documentId}/pdf`,
        certificate: `/api/admin/documents/${result.documentId}/certificate`,
      },
      validateUrl: `/pt-br/validar-assinatura?code=${encodeURIComponent(result.authenticityCode)}`,
    });
  } catch (error) {
    if (error instanceof MfaStepUpError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return jsonError(error);
  }
}
