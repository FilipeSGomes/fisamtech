import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

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
    "Assinatura eletrônica interna FISAM TECH (não é ICP-Brasil).",
    "Valide em: https://www.fisamtech.com/pt-br/validar-assinatura",
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
      maxWidth: width - 112,
    });
    y -= 16;
  }

  return Buffer.from(await pdf.save());
}
