import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import {
  buildValidationUrl,
  drawValidationQr,
} from "./validation-qr";

export async function stampSignedPdf(opts: {
  sourcePdf: Buffer;
  signerName: string;
  signerEmail: string;
  signedAt: string;
  authenticityCode: string;
  mfaStepUp: boolean;
}): Promise<Buffer> {
  const pdf = await PDFDocument.load(opts.sourcePdf, {
    ignoreEncryption: true,
  });
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const page = pdf.addPage();
  const { width, height } = page.getSize();
  const ink = rgb(0.12, 0.14, 0.18);
  const muted = rgb(0.4, 0.42, 0.46);
  const rule = rgb(0.75, 0.76, 0.78);
  const validateUrl = buildValidationUrl(opts.authenticityCode);

  const signedAtLabel = new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(opts.signedAt));

  let y = height - 72;
  page.drawText("Assinado eletronicamente", {
    x: 56,
    y,
    size: 14,
    font: fontBold,
    color: ink,
  });
  y -= 28;

  const lines = [
    opts.signerName,
    opts.signerEmail,
    `${signedAtLabel} · horário de Brasília`,
    opts.mfaStepUp
      ? "Assinatura confirmada com MFA (TOTP)"
      : "Sessão autenticada",
    `Código de autenticidade ${opts.authenticityCode}`,
  ];

  page.drawLine({
    start: { x: 56, y: y + 12 },
    end: { x: 240, y: y + 12 },
    thickness: 0.8,
    color: rule,
  });

  for (const [index, line] of lines.entries()) {
    page.drawText(line, {
      x: 56,
      y,
      size: index === 0 ? 11 : 10,
      font: index === 0 ? fontBold : font,
      color: index === 0 ? ink : muted,
      maxWidth: Math.max(180, width - 220),
    });
    y -= 16;
  }

  y -= 8;
  page.drawText("Escaneie o QR para validar este documento:", {
    x: 56,
    y,
    size: 9,
    font: fontBold,
    color: muted,
  });
  y -= 118;

  const qrSize = 110;
  await drawValidationQr({
    pdf,
    page,
    authenticityCode: opts.authenticityCode,
    x: 56,
    y: Math.max(40, y),
    size: qrSize,
  });

  page.drawText(validateUrl, {
    x: 56 + qrSize + 16,
    y: Math.max(40, y) + qrSize / 2,
    size: 8,
    font,
    color: muted,
    maxWidth: width - (56 + qrSize + 32),
  });

  return Buffer.from(await pdf.save());
}
