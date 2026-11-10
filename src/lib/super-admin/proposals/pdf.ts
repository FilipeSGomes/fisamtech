import { readFile } from "node:fs/promises";
import path from "node:path";
import {
  PDFDocument,
  rgb,
  StandardFonts,
  type PDFFont,
  type PDFImage,
  type PDFPage,
} from "pdf-lib";

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

const PAGE = { width: 595.28, height: 841.89 };
/** Content band clears logo header + branded footer already on the letterhead. */
const MARGIN = { left: 52, right: 52, top: 205, bottom: 115 };

function moneyLabel(currency: string, amount: string): string {
  return `${currency} ${amount}`;
}

function wrapText(
  text: string,
  font: PDFFont,
  size: number,
  maxWidth: number
): string[] {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return [""];
  const lines: string[] = [];
  let current = words[0];
  for (let i = 1; i < words.length; i++) {
    const next = `${current} ${words[i]}`;
    if (font.widthOfTextAtSize(next, size) <= maxWidth) current = next;
    else {
      lines.push(current);
      current = words[i];
    }
  }
  lines.push(current);
  return lines;
}

async function loadLetterheadImage(
  pdf: PDFDocument
): Promise<PDFImage | null> {
  try {
    const letterheadPath = path.join(
      process.cwd(),
      "private",
      "branding",
      "papel-timbrado-fisam-tech.png"
    );
    const pngBytes = await readFile(letterheadPath);
    return pdf.embedPng(pngBytes);
  } catch {
    return null;
  }
}

function stampLetterhead(page: PDFPage, image: PDFImage | null) {
  if (!image) return;
  page.drawImage(image, {
    x: 0,
    y: 0,
    width: PAGE.width,
    height: PAGE.height,
  });
}

export async function generateProposalPdf(
  input: ProposalPdfInput
): Promise<Buffer> {
  const pdf = await PDFDocument.create();
  const letterhead = await loadLetterheadImage(pdf);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const ink = rgb(0.08, 0.1, 0.14);
  const muted = rgb(0.35, 0.4, 0.46);
  const rule = rgb(0.82, 0.84, 0.87);

  let page = pdf.addPage([PAGE.width, PAGE.height]);
  stampLetterhead(page, letterhead);
  let y = PAGE.height - MARGIN.top;

  const contentWidth = PAGE.width - MARGIN.left - MARGIN.right;
  const colDesc = MARGIN.left;
  const colQty = MARGIN.left + contentWidth * 0.58;
  const colPrice = MARGIN.left + contentWidth * 0.72;
  const colTotal = PAGE.width - MARGIN.right;
  const descMax = contentWidth * 0.55;

  const newPage = () => {
    page = pdf.addPage([PAGE.width, PAGE.height]);
    stampLetterhead(page, letterhead);
    y = PAGE.height - MARGIN.top;
  };

  const need = (height: number) => {
    if (y - height < MARGIN.bottom) newPage();
  };

  // Brand block is already on the letterhead — do not redraw company/CNPJ/tagline.
  page.drawText("PROPOSTA COMERCIAL", {
    x: MARGIN.left,
    y,
    size: 15,
    font: fontBold,
    color: ink,
  });
  y -= 18;
  page.drawText(`${input.numberDisplay}  ·  versão ${input.version}`, {
    x: MARGIN.left,
    y,
    size: 10,
    font,
    color: muted,
  });
  y -= 22;

  for (const line of wrapText(input.title, fontBold, 12, contentWidth)) {
    need(16);
    page.drawText(line, {
      x: MARGIN.left,
      y,
      size: 12,
      font: fontBold,
      color: ink,
    });
    y -= 15;
  }
  y -= 8;

  const meta: string[] = [];
  if (input.companyName) meta.push(`Cliente: ${input.companyName}`);
  if (input.contactName || input.contactEmail) {
    meta.push(
      `Contato: ${[input.contactName, input.contactEmail].filter(Boolean).join(" · ")}`
    );
  }
  if (input.validUntil) meta.push(`Validade: ${input.validUntil}`);
  for (const line of meta) {
    need(14);
    page.drawText(line, {
      x: MARGIN.left,
      y,
      size: 10,
      font,
      color: ink,
    });
    y -= 14;
  }

  y -= 6;
  page.drawLine({
    start: { x: MARGIN.left, y },
    end: { x: PAGE.width - MARGIN.right, y },
    thickness: 0.8,
    color: rule,
  });
  y -= 18;

  need(28);
  page.drawText("Itens", {
    x: MARGIN.left,
    y,
    size: 11,
    font: fontBold,
    color: ink,
  });
  y -= 16;
  page.drawText("Descrição", {
    x: colDesc,
    y,
    size: 8,
    font: fontBold,
    color: muted,
  });
  page.drawText("Qtd", { x: colQty, y, size: 8, font: fontBold, color: muted });
  page.drawText("Unit.", {
    x: colPrice,
    y,
    size: 8,
    font: fontBold,
    color: muted,
  });
  page.drawText("Total", {
    x: colTotal - fontBold.widthOfTextAtSize("Total", 8),
    y,
    size: 8,
    font: fontBold,
    color: muted,
  });
  y -= 6;
  page.drawLine({
    start: { x: MARGIN.left, y },
    end: { x: PAGE.width - MARGIN.right, y },
    thickness: 0.5,
    color: rule,
  });
  y -= 14;

  for (const item of input.items) {
    const descLines = wrapText(item.description, font, 9, descMax);
    const block = Math.max(descLines.length, 1) * 12 + 8;
    need(block);
    const rowTop = y;
    descLines.forEach((line, idx) => {
      page.drawText(line, {
        x: colDesc,
        y: rowTop - idx * 12,
        size: 9,
        font,
        color: ink,
      });
    });
    page.drawText(`${item.quantity} ${item.unit}`, {
      x: colQty,
      y: rowTop,
      size: 9,
      font,
      color: ink,
    });
    page.drawText(moneyLabel(input.currency, item.unitPrice), {
      x: colPrice,
      y: rowTop,
      size: 9,
      font,
      color: ink,
    });
    const lineTotal = moneyLabel(input.currency, item.lineTotal);
    page.drawText(lineTotal, {
      x: colTotal - fontBold.widthOfTextAtSize(lineTotal, 9),
      y: rowTop,
      size: 9,
      font: fontBold,
      color: ink,
    });
    y = rowTop - Math.max(descLines.length, 1) * 12;
    if (Number(item.discount) > 0) {
      need(12);
      page.drawText(
        `Desconto: ${moneyLabel(input.currency, item.discount)}`,
        { x: colDesc + 8, y, size: 8, font, color: muted }
      );
      y -= 12;
    }
    y -= 6;
  }

  need(88);
  const totalsX = MARGIN.left + contentWidth * 0.52;
  const totalsBoxTop = y + 10;
  const totalsBoxHeight = 62;
  // Soft panel so totals stay readable over letterhead watermark.
  page.drawRectangle({
    x: totalsX - 10,
    y: totalsBoxTop - totalsBoxHeight,
    width: PAGE.width - MARGIN.right - (totalsX - 10),
    height: totalsBoxHeight,
    color: rgb(1, 1, 1),
    opacity: 0.88,
    borderColor: rule,
    borderWidth: 0.5,
  });
  y = totalsBoxTop - 16;

  const totalRows: Array<[string, string, boolean]> = [
    ["Subtotal", moneyLabel(input.currency, input.subtotal), false],
    ["Descontos", moneyLabel(input.currency, input.discountTotal), false],
    ["Total", moneyLabel(input.currency, input.total), true],
  ];
  for (const [label, value, bold] of totalRows) {
    const size = bold ? 11 : 10;
    const f = bold ? fontBold : font;
    page.drawText(label, { x: totalsX, y, size, font: f, color: ink });
    page.drawText(value, {
      x: colTotal - f.widthOfTextAtSize(value, size),
      y,
      size,
      font: f,
      color: ink,
    });
    y -= bold ? 16 : 14;
  }

  // Keep confidentiality note; letterhead already shows contacts. Sit above footer art.
  for (const p of pdf.getPages()) {
    p.drawText("Uso comercial confidencial.", {
      x: MARGIN.left,
      y: MARGIN.bottom - 28,
      size: 8,
      font,
      color: muted,
    });
  }

  return Buffer.from(await pdf.save());
}
