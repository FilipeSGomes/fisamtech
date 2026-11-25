import { randomUUID } from "node:crypto";
import { adminQuery } from "@/lib/db";
import { writeAudit } from "@/lib/super-admin/audit/write";
import {
  buildAuthenticityCode,
  checksumSha256,
  normalizeAuthenticityCode,
} from "./authenticity";
import { generateSignatureCertificate } from "./certificate";
import { verifyMfaStepUp } from "./mfa-stepup";
import { stampSignedPdf } from "./stamp-pdf";
import {
  buildValidationUrl,
  validationQrDataUrl,
} from "./validation-qr";

export const MAX_SIGNED_PDF_BYTES = 10 * 1024 * 1024;

export type SignedDocumentListItem = {
  id: string;
  title: string;
  originalFilename: string;
  authenticityCode: string;
  signerName: string;
  signerEmail: string;
  signedAt: string;
  createdAt: string;
};

export type SignDocumentResult = {
  documentId: string;
  authenticityCode: string;
  signedAt: string;
  checksumSha256: string;
  validateUrl: string;
  qrDataUrl: string;
};

export async function signDocument(opts: {
  title: string;
  originalFilename: string;
  pdfBytes: Buffer;
  totp: string;
  actorUserId: string;
  actorName: string;
  actorEmail: string;
  sessionToken: string;
  ip?: string | null;
  userAgent?: string | null;
}): Promise<SignDocumentResult> {
  if (!opts.pdfBytes?.length) {
    throw new Error("Envie um arquivo PDF");
  }
  if (opts.pdfBytes.length > MAX_SIGNED_PDF_BYTES) {
    throw new Error("PDF acima do limite de 10 MB");
  }
  if (!opts.pdfBytes.subarray(0, 5).toString("utf8").startsWith("%PDF")) {
    throw new Error("Arquivo inválido — envie um PDF");
  }

  const title = opts.title.trim();
  if (!title) throw new Error("Informe o título do documento");

  const stepUp = await verifyMfaStepUp({
    userId: opts.actorUserId,
    sessionToken: opts.sessionToken,
    totp: opts.totp,
  });

  const documentId = randomUUID();
  const signedAt = new Date().toISOString();
  const sourceChecksum = checksumSha256(opts.pdfBytes);

  // Provisional code from stable inputs (document id is known before insert)
  const authenticityCode = buildAuthenticityCode([
    documentId,
    opts.actorUserId,
    signedAt,
    sourceChecksum,
  ]);

  const stamped = await stampSignedPdf({
    sourcePdf: opts.pdfBytes,
    signerName: opts.actorName,
    signerEmail: opts.actorEmail,
    signedAt,
    authenticityCode,
    mfaStepUp: true,
  });

  const finalChecksum = checksumSha256(stamped);

  const certificate = await generateSignatureCertificate({
    title,
    originalFilename: opts.originalFilename,
    signerName: opts.actorName,
    signerEmail: opts.actorEmail,
    signedAt,
    mfaStepUpAt: stepUp.steppedUpAt,
    authenticityCode,
    checksumSha256: finalChecksum,
  });

  await adminQuery(
    `insert into signed_documents (
       id, title, original_filename, content_type, pdf_bytes, checksum_sha256,
       authenticity_code, signer_user_id, signer_name, signer_email,
       signed_at, mfa_step_up_at, certificate_bytes
     ) values (
       $1,$2,$3,'application/pdf',$4,$5,$6,$7,$8,$9,$10,$11,$12
     )`,
    [
      documentId,
      title,
      opts.originalFilename.slice(0, 255),
      stamped,
      finalChecksum,
      authenticityCode,
      opts.actorUserId,
      opts.actorName,
      opts.actorEmail,
      signedAt,
      stepUp.steppedUpAt,
      certificate,
    ]
  );

  await writeAudit({
    action: "DOCUMENT_SIGNED",
    actorUserId: opts.actorUserId,
    resourceType: "signed_document",
    resourceId: documentId,
    ip: opts.ip,
    userAgent: opts.userAgent,
    context: {
      authenticityCode,
      title,
      mfaStepUpAt: stepUp.steppedUpAt,
      checksumSha256: finalChecksum,
    },
  });

  return {
    documentId,
    authenticityCode,
    signedAt,
    checksumSha256: finalChecksum,
    validateUrl: buildValidationUrl(authenticityCode),
    qrDataUrl: await validationQrDataUrl(authenticityCode),
  };
}

export async function listSignedDocuments(opts?: {
  limit?: number;
}): Promise<SignedDocumentListItem[]> {
  const limit = Math.min(Math.max(opts?.limit ?? 50, 1), 100);
  const result = await adminQuery<{
    id: string;
    title: string;
    original_filename: string;
    authenticity_code: string;
    signer_name: string;
    signer_email: string;
    signed_at: Date | string;
    created_at: Date | string;
  }>(
    `select id, title, original_filename, authenticity_code,
            signer_name, signer_email, signed_at, created_at
     from signed_documents
     order by created_at desc
     limit $1`,
    [limit]
  );

  return result.rows.map((row) => ({
    id: row.id,
    title: row.title,
    originalFilename: row.original_filename,
    authenticityCode: row.authenticity_code,
    signerName: row.signer_name,
    signerEmail: row.signer_email,
    signedAt:
      row.signed_at instanceof Date
        ? row.signed_at.toISOString()
        : String(row.signed_at),
    createdAt:
      row.created_at instanceof Date
        ? row.created_at.toISOString()
        : String(row.created_at),
  }));
}

export async function loadSignedDocumentPdf(
  id: string
): Promise<{ bytes: Buffer; filename: string } | null> {
  const result = await adminQuery<{
    pdf_bytes: Buffer;
    title: string;
    authenticity_code: string;
  }>(
    `select pdf_bytes, title, authenticity_code from signed_documents where id = $1`,
    [id]
  );
  const row = result.rows[0];
  if (!row) return null;
  const safe = row.title.replace(/[^\w.-]+/g, "_").slice(0, 60);
  return {
    bytes: Buffer.from(row.pdf_bytes),
    filename: `${safe}-${row.authenticity_code}.pdf`,
  };
}

export async function loadSignedDocumentCertificate(
  id: string
): Promise<{ bytes: Buffer; filename: string } | null> {
  const result = await adminQuery<{
    certificate_bytes: Buffer;
    authenticity_code: string;
  }>(
    `select certificate_bytes, authenticity_code from signed_documents where id = $1`,
    [id]
  );
  const row = result.rows[0];
  if (!row) return null;
  return {
    bytes: Buffer.from(row.certificate_bytes),
    filename: `certificado-${row.authenticity_code}.pdf`,
  };
}

export type SignedDocumentAuthenticityLookup = {
  valid: boolean;
  authenticityCode: string;
  signerName: string | null;
  signerEmail: string | null;
  signedAt: string | null;
  documentTitle: string | null;
  documentKind: "signed_document" | null;
  checksumShort: string | null;
};

export async function lookupSignedDocumentAuthenticity(
  code: string
): Promise<SignedDocumentAuthenticityLookup> {
  const normalized = normalizeAuthenticityCode(code);
  if (!normalized || normalized.length < 8 || normalized.length > 64) {
    return {
      valid: false,
      authenticityCode: normalized,
      signerName: null,
      signerEmail: null,
      signedAt: null,
      documentTitle: null,
      documentKind: null,
      checksumShort: null,
    };
  }

  const result = await adminQuery<{
    authenticity_code: string;
    signer_name: string;
    signer_email: string;
    signed_at: Date | string;
    title: string;
    checksum_sha256: string;
  }>(
    `select authenticity_code, signer_name, signer_email, signed_at, title, checksum_sha256
     from signed_documents
     where authenticity_code = $1
     limit 1`,
    [normalized]
  );

  const row = result.rows[0];
  if (!row) {
    return {
      valid: false,
      authenticityCode: normalized,
      signerName: null,
      signerEmail: null,
      signedAt: null,
      documentTitle: null,
      documentKind: null,
      checksumShort: null,
    };
  }

  return {
    valid: true,
    authenticityCode: row.authenticity_code,
    signerName: row.signer_name,
    signerEmail: row.signer_email,
    signedAt:
      row.signed_at instanceof Date
        ? row.signed_at.toISOString()
        : String(row.signed_at),
    documentTitle: row.title,
    documentKind: "signed_document",
    checksumShort: row.checksum_sha256.slice(0, 12),
  };
}
