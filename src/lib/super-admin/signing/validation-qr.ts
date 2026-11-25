import QRCode from "qrcode";
import type { PDFDocument, PDFPage } from "pdf-lib";

const PUBLIC_ORIGIN =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
  "https://www.fisamtech.com";

export function buildValidationPageUrl(locale = "pt-br"): string {
  return `${PUBLIC_ORIGIN}/${locale}/validar-assinatura`;
}

export function buildValidationUrl(
  authenticityCode: string,
  locale = "pt-br"
): string {
  const code = encodeURIComponent(authenticityCode.trim().toUpperCase());
  return `${buildValidationPageUrl(locale)}?code=${code}`;
}

export async function validationPageQrDataUrl(
  locale = "pt-br"
): Promise<string> {
  return QRCode.toDataURL(buildValidationPageUrl(locale), {
    errorCorrectionLevel: "M",
    margin: 1,
    width: 180,
    color: { dark: "#0f1724", light: "#ffffff" },
  });
}

export async function validationQrPng(authenticityCode: string): Promise<Buffer> {
  const url = buildValidationUrl(authenticityCode);
  return QRCode.toBuffer(url, {
    type: "png",
    errorCorrectionLevel: "M",
    margin: 1,
    width: 280,
    color: { dark: "#0f1724", light: "#ffffff" },
  });
}

export async function validationQrDataUrl(
  authenticityCode: string
): Promise<string> {
  return QRCode.toDataURL(buildValidationUrl(authenticityCode), {
    errorCorrectionLevel: "M",
    margin: 1,
    width: 220,
    color: { dark: "#0f1724", light: "#ffffff" },
  });
}

export async function drawValidationQr(opts: {
  pdf: PDFDocument;
  page: PDFPage;
  authenticityCode: string;
  x: number;
  y: number;
  size?: number;
}): Promise<void> {
  const size = opts.size ?? 110;
  const png = await validationQrPng(opts.authenticityCode);
  const image = await opts.pdf.embedPng(png);
  opts.page.drawImage(image, {
    x: opts.x,
    y: opts.y,
    width: size,
    height: size,
  });
}
