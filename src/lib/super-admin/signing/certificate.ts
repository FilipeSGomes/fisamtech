import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { CONTACT } from "@/lib/config";
import {
  buildValidationUrl,
  drawValidationQr,
} from "./validation-qr";

export async function generateSignatureCertificate(opts: {
  title: string;
  originalFilename: string;
  signerName: string;
  signerEmail: string;
  signedAt: string;
  mfaStepUpAt: string;
  authenticityCode: string;
  checksumSha256: string;
}): Promise<Buffer> {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([595.28, 841.89]); // A4
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const ink = rgb(0.12, 0.14, 0.18);
  const muted = rgb(0.4, 0.42, 0.46);
  const accent = rgb(0.15, 0.35, 0.55);
  const validateUrl = buildValidationUrl(opts.authenticityCode);

  const fmt = (iso: string) =>
    new Intl.DateTimeFormat("pt-BR", {
      timeZone: "America/Sao_Paulo",
      dateStyle: "short",
      timeStyle: "short",
    }).format(new Date(iso));

  let y = 780;
  page.drawText(CONTACT.company, {
    x: 56,
    y,
    size: 18,
    font: fontBold,
    color: accent,
  });
  y -= 22;
  page.drawText("Certificado de assinatura eletrônica", {
    x: 56,
    y,
    size: 14,
    font: fontBold,
    color: ink,
  });
  y -= 18;
  page.drawText(
    `${CONTACT.legalName} · CNPJ ${CONTACT.cnpj} · ${CONTACT.email}`,
    { x: 56, y, size: 9, font, color: muted, maxWidth: 480 }
  );
  y -= 36;

  const rows: Array<[string, string]> = [
    ["Documento", opts.title],
    ["Arquivo original", opts.originalFilename],
    ["Signatário", opts.signerName],
    ["E-mail", opts.signerEmail],
    ["Assinado em", `${fmt(opts.signedAt)} (Brasília)`],
    ["MFA (TOTP) confirmado em", `${fmt(opts.mfaStepUpAt)} (Brasília)`],
    ["Código de autenticidade", opts.authenticityCode],
    ["Checksum SHA-256", opts.checksumSha256],
    ["Validação pública", validateUrl],
  ];

  for (const [label, value] of rows) {
    page.drawText(label, { x: 56, y, size: 9, font: fontBold, color: muted });
    y -= 14;
    page.drawText(value, {
      x: 56,
      y,
      size: label === "Validação pública" ? 8 : 11,
      font,
      color: ink,
      maxWidth: 360,
    });
    y -= 22;
  }

  // QR on the right side of the certificate body
  await drawValidationQr({
    pdf,
    page,
    authenticityCode: opts.authenticityCode,
    x: 420,
    y: 520,
    size: 120,
  });
  page.drawText("Escaneie para validar", {
    x: 422,
    y: 508,
    size: 8,
    font: fontBold,
    color: muted,
  });

  return Buffer.from(await pdf.save());
}
