import { readFile } from "node:fs/promises";
import path from "node:path";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

export const FISAM_LETTERHEAD = {
  company: "FISAM TECH TECNOLOGIA LTDA",
  cnpj: "59.897.573/0001-02",
  email: "contato@fisamtech.com",
  tagline: "Engenharia que conecta tecnologia e negócio",
};

export type ProposalPdfInput = {
  numberDisplay: string;
  title: string;
  version: number;
  currency: string;
  validUntil?: string | null;
  companyName?: string | null;
  contactName?: string | null;
  contactEmail?: string | null;
  items: Array<{
    description: string;
    quantity: number;
    unit: string;
    unitPrice: string;
    discount: string;
    lineTotal: string;
  }>;
  subtotal: string;
  discountTotal: string;
  total: string;
};

function moneyLabel(currency: string, amount: string): string {
  return `${currency} ${amount}`;
}

export async function generateProposalPdf(
  input: ProposalPdfInput
): Promise<Buffer> {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([595.28, 841.89]); // A4
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);

  const letterheadPath = path.join(
    process.cwd(),
    "private",
    "branding",
    "papel-timbrado-fisam-tech.png"
  );
  try {
    const pngBytes = await readFile(letterheadPath);
    const png = await pdf.embedPng(pngBytes);
    const scale = Math.min(
      page.getWidth() / png.width,
      page.getHeight() / png.height
    );
    const w = png.width * scale;
    const h = png.height * scale;
    page.drawImage(png, {
      x: (page.getWidth() - w) / 2,
      y: (page.getHeight() - h) / 2,
      width: w,
      height: h,
      opacity: 0.18,
    });
  } catch {
    // Letterhead optional at build-time; content still renders.
  }

  const ink = rgb(0.09, 0.14, 0.2);
  const muted = rgb(0.4, 0.45, 0.5);
  let y = 780;

  page.drawText(FISAM_LETTERHEAD.company, {
    x: 48,
    y,
    size: 12,
    font: fontBold,
    color: ink,
  });
  y -= 16;
  page.drawText(`CNPJ ${FISAM_LETTERHEAD.cnpj} · ${FISAM_LETTERHEAD.email}`, {
    x: 48,
    y,
    size: 9,
    font,
    color: muted,
  });
  y -= 14;
  page.drawText(FISAM_LETTERHEAD.tagline, {
    x: 48,
    y,
    size: 9,
    font,
    color: muted,
  });

  y -= 36;
  page.drawText("PROPOSTA COMERCIAL", {
    x: 48,
    y,
    size: 16,
    font: fontBold,
    color: ink,
  });
  y -= 22;
  page.drawText(`${input.numberDisplay} · versão ${input.version}`, {
    x: 48,
    y,
    size: 11,
    font,
    color: ink,
  });
  y -= 18;
  page.drawText(input.title, { x: 48, y, size: 12, font: fontBold, color: ink });

  y -= 28;
  if (input.companyName) {
    page.drawText(`Cliente: ${input.companyName}`, {
      x: 48,
      y,
      size: 10,
      font,
      color: ink,
    });
    y -= 14;
  }
  if (input.contactName || input.contactEmail) {
    page.drawText(
      `Contato: ${[input.contactName, input.contactEmail].filter(Boolean).join(" · ")}`,
      { x: 48, y, size: 10, font, color: ink }
    );
    y -= 14;
  }
  if (input.validUntil) {
    page.drawText(`Validade: ${input.validUntil}`, {
      x: 48,
      y,
      size: 10,
      font,
      color: ink,
    });
    y -= 14;
  }

  y -= 18;
  page.drawText("Itens", { x: 48, y, size: 11, font: fontBold, color: ink });
  y -= 16;

  for (const item of input.items) {
    if (y < 120) break;
    const line = `${item.description} — ${item.quantity} ${item.unit} × ${moneyLabel(input.currency, item.unitPrice)}`;
    page.drawText(line.slice(0, 90), { x: 48, y, size: 9, font, color: ink });
    page.drawText(moneyLabel(input.currency, item.lineTotal), {
      x: 430,
      y,
      size: 9,
      font: fontBold,
      color: ink,
    });
    y -= 14;
    if (Number(item.discount) > 0) {
      page.drawText(`Desconto: ${moneyLabel(input.currency, item.discount)}`, {
        x: 60,
        y,
        size: 8,
        font,
        color: muted,
      });
      y -= 12;
    }
  }

  y -= 20;
  page.drawText(`Subtotal: ${moneyLabel(input.currency, input.subtotal)}`, {
    x: 350,
    y,
    size: 10,
    font,
    color: ink,
  });
  y -= 14;
  page.drawText(`Descontos: ${moneyLabel(input.currency, input.discountTotal)}`, {
    x: 350,
    y,
    size: 10,
    font,
    color: ink,
  });
  y -= 16;
  page.drawText(`Total: ${moneyLabel(input.currency, input.total)}`, {
    x: 350,
    y,
    size: 12,
    font: fontBold,
    color: ink,
  });

  page.drawText(
    "Documento gerado pelo Super Admin FISAM TECH. Uso comercial confidencial.",
    { x: 48, y: 48, size: 8, font, color: muted }
  );

  const bytes = await pdf.save();
  return Buffer.from(bytes);
}
