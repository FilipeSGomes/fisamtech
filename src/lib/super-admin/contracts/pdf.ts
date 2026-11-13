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
import { CONTACT } from "@/lib/config";

export type ContractPdfItem = {
  description: string;
  quantity: number;
  unit: string;
  unitPrice: string;
  discount: string;
  lineTotal: string;
};

export type ContractPdfInput = {
  numberDisplay: string;
  clientLegalName: string;
  clientTaxId?: string | null;
  clientAddress?: string | null;
  clientRepName: string;
  clientRepTitle?: string | null;
  projectName: string;
  currency: string;
  paymentTerms: string;
  termMonths: number;
  startOnLabel?: string | null;
  proposalNumber?: string | null;
  items: ContractPdfItem[];
  subtotal: string;
  discountTotal: string;
  total: string;
  signedCity: string;
  signedOnLabel: string;
};

const PAGE = { width: 595.28, height: 841.89 };
const MARGIN = { left: 52, right: 52, top: 200, bottom: 110 };

const FISAM = {
  legalName: CONTACT.legalName,
  cnpj: CONTACT.cnpj,
  address:
    "Rua Inacio Pires de Moraes 549 Apt 42 Bloco 5 B, Centro, Embu-Guaçu/SP, CEP 06900-070",
  repName: "Filipe Godinho Gomes",
  repTitle: "CEO",
};

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

async function loadLetterhead(pdf: PDFDocument): Promise<PDFImage | null> {
  try {
    const bytes = await readFile(
      path.join(process.cwd(), "private", "branding", "papel-timbrado-fisam-tech.png")
    );
    return pdf.embedPng(bytes);
  } catch {
    return null;
  }
}

function stamp(page: PDFPage, image: PDFImage | null) {
  if (!image) return;
  page.drawImage(image, {
    x: 0,
    y: 0,
    width: PAGE.width,
    height: PAGE.height,
  });
}

function formatMoney(value: string, currency: string): string {
  const n = Number(value);
  if (!Number.isFinite(n)) return `${currency} ${value}`;
  try {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: currency || "BRL",
    }).format(n);
  } catch {
    return `${currency} ${n.toFixed(2)}`;
  }
}

export async function generateServiceContractPdf(
  input: ContractPdfInput
): Promise<Buffer> {
  const pdf = await PDFDocument.create();
  const letterhead = await loadLetterhead(pdf);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const ink = rgb(0.08, 0.1, 0.14);
  const muted = rgb(0.35, 0.4, 0.46);

  let page = pdf.addPage([PAGE.width, PAGE.height]);
  stamp(page, letterhead);
  let y = PAGE.height - MARGIN.top;
  const width = PAGE.width - MARGIN.left - MARGIN.right;

  const newPage = () => {
    page = pdf.addPage([PAGE.width, PAGE.height]);
    stamp(page, letterhead);
    y = PAGE.height - MARGIN.top;
  };
  const need = (h: number) => {
    if (y - h < MARGIN.bottom) newPage();
  };

  const drawLines = (
    text: string,
    opts?: { bold?: boolean; size?: number; gap?: number; color?: typeof ink }
  ) => {
    const size = opts?.size ?? 9.5;
    const f = opts?.bold ? fontBold : font;
    const color = opts?.color ?? ink;
    const gap = opts?.gap ?? 12;
    for (const line of wrapText(text, f, size, width)) {
      need(gap);
      page.drawText(line, { x: MARGIN.left, y, size, font: f, color });
      y -= gap;
    }
  };

  const clientTax = input.clientTaxId?.trim() || "a informar";
  const clientAddress = input.clientAddress?.trim() || "a informar";
  const clientTitle = input.clientRepTitle?.trim() || "Representante legal";
  const startLabel = input.startOnLabel?.trim() || "a definir pelas Partes";
  const proposalRef = input.proposalNumber
    ? ` Este contrato incorpora a proposta comercial ${input.proposalNumber}, naquilo que não conflitar com as cláusulas abaixo.`
    : "";

  drawLines("CONTRATO DE PRESTAÇÃO DE SERVIÇOS", {
    bold: true,
    size: 13,
    gap: 16,
  });
  drawLines("Engenharia de software, integração e serviços técnicos", {
    size: 9,
    color: muted,
    gap: 12,
  });
  y -= 6;

  drawLines(
    `Documento ${input.numberDisplay}. Pelo presente instrumento particular, as partes abaixo identificadas celebram este Contrato de Prestação de Serviços (“Contrato”):`
  );
  y -= 6;

  drawLines("CONTRATANTE", { bold: true, size: 10, gap: 13 });
  drawLines(
    `${input.clientLegalName}, ${clientTax}, com endereço em ${clientAddress}, representada por ${input.clientRepName}, ${clientTitle}, doravante “CONTRATANTE”.`
  );
  y -= 4;

  drawLines("CONTRATADA", { bold: true, size: 10, gap: 13 });
  drawLines(
    `${FISAM.legalName}, CNPJ ${FISAM.cnpj}, com sede em ${FISAM.address}, representada por ${FISAM.repName}, ${FISAM.repTitle}, doravante “FISAM TECH”.`
  );
  drawLines("CONTRATANTE e FISAM TECH, em conjunto, “Partes”.");
  y -= 8;

  const sections: Array<{ title: string; paras: string[] }> = [
    {
      title: "1. Objeto",
      paras: [
        `1.1. O objeto deste Contrato é a prestação, pela FISAM TECH à CONTRATANTE, de serviços técnicos relacionados ao projeto “${input.projectName}”, conforme escopo, itens e valores descritos neste instrumento e em seu Anexo I.${proposalRef}`,
        "1.2. Este Contrato não cria sociedade, joint venture, representação comercial exclusiva nem vínculo empregatício entre as Partes ou seus colaboradores.",
      ],
    },
    {
      title: "2. Escopo e entregáveis",
      paras: [
        "2.1. O escopo está descrito no Anexo I (itens de serviço). Alterações de escopo (“change requests”) deverão ser formalizadas por escrito e poderão implicar ajuste de prazo e preço.",
        "2.2. A FISAM TECH executará os serviços com diligência técnica razoável, observados os padrões de mercado e as informações fornecidas pela CONTRATANTE.",
        "2.3. A CONTRATANTE fornecerá acessos, dados, decisões e aprovações necessárias em tempo hábil. Atrasos da CONTRATANTE poderão prorrogar prazos proporcionalmente.",
      ],
    },
    {
      title: "3. Preço e pagamento",
      paras: [
        `3.1. O valor total dos serviços é de ${formatMoney(input.total, input.currency)} (${input.currency}), conforme Anexo I.`,
        `3.2. Condições de pagamento: ${input.paymentTerms}.`,
        "3.3. Os valores serão faturados mediante nota fiscal/documento fiscal aplicável. O atraso no pagamento superior a 10 (dez) dias corridos autoriza a suspensão dos serviços até a regularização, sem prejuízo de encargos legais.",
        "3.4. Impostos, taxas e contribuições incidentes sobre a prestação seguirão a legislação aplicável e a natureza fiscal da operação.",
      ],
    },
    {
      title: "4. Prazo",
      paras: [
        `4.1. A vigência inicia em ${startLabel} e permanece por ${input.termMonths} (${input.termMonths}) meses, podendo ser prorrogada por acordo escrito das Partes, sem prejuízo de cronogramas específicos de entregáveis.`,
        "4.2. Prazos de entrega estimados dependem da colaboração da CONTRATANTE e da estabilidade do escopo.",
      ],
    },
    {
      title: "5. Obrigações das Partes",
      paras: [
        "5.1. São obrigações da FISAM TECH: executar o escopo contratado; comunicar riscos relevantes; preservar confidencialidade; e entregar os artefatos acordados nos ambientes definidos.",
        "5.2. São obrigações da CONTRATANTE: indicar interlocutor; fornecer informações verídicas; disponibilizar ambientes e credenciais; validar entregas em prazo razoável; e efetuar os pagamentos.",
      ],
    },
    {
      title: "6. Aceite",
      paras: [
        "6.1. Cada entrega relevante será submetida a aceite da CONTRATANTE. Considera-se aceita a entrega não rejeitada motivadamente em até 7 (sete) dias corridos da apresentação, salvo prazo diverso acordado por escrito.",
        "6.2. Rejeições deverão indicar, de forma objetiva, o desvio em relação ao escopo contratado.",
      ],
    },
    {
      title: "7. Propriedade intelectual",
      paras: [
        "7.1. Código, documentação e materiais preexistentes de cada Parte permanecem de sua titularidade.",
        "7.2. Salvo disposição em contrário em proposta ou aditivo, os entregáveis específicos desenvolvidos exclusivamente para a CONTRATANTE no âmbito deste Contrato, após o pagamento integral correspondente, passam à titularidade da CONTRATANTE, preservados componentes, frameworks, bibliotecas, metodologias e know-how genéricos da FISAM TECH.",
        "7.3. Softwares de terceiros e open source observarão suas respectivas licenças.",
      ],
    },
    {
      title: "8. Confidencialidade e dados pessoais",
      paras: [
        "8.1. As Partes manterão sigilo sobre informações não públicas trocadas em razão deste Contrato, pelo prazo de 5 (cinco) anos após o término, ou por prazo maior se decorrente de NDA específico eventualmente firmado.",
        "8.2. Se houver tratamento de dados pessoais, as Partes observarão a Lei nº 13.709/2018 (LGPD), limitando o uso ao necessário à execução dos serviços.",
      ],
    },
    {
      title: "9. Responsabilidade",
      paras: [
        "9.1. A responsabilidade de cada Parte limita-se aos danos diretos comprovadamente causados por dolo ou culpa, excluídos lucros cessantes e danos indiretos, na máxima extensão permitida pela lei.",
        "9.2. Salvo dolo, a responsabilidade agregada da FISAM TECH neste Contrato não excederá o valor efetivamente pago pela CONTRATANTE nos 12 (doze) meses anteriores ao evento.",
      ],
    },
    {
      title: "10. Rescisão",
      paras: [
        "10.1. Qualquer Parte poderá rescindir por justa causa em caso de descumprimento relevante não sanado em 15 (quinze) dias após notificação escrita.",
        "10.2. A CONTRATANTE poderá rescindir imotivadamente mediante aviso prévio de 30 (trinta) dias, pagando os serviços já executados e custos não recuperáveis comprovados até a data efetiva da rescisão.",
      ],
    },
    {
      title: "11. Disposições gerais",
      paras: [
        "11.1. Alterações deverão ser formalizadas por escrito, inclusive por assinatura eletrônica.",
        "11.2. A eventual tolerância não implica renúncia. Se uma disposição for inválida, as demais permanecem em vigor.",
        "11.3. Este Contrato constitui o acordo integral quanto ao seu objeto, prevalecendo sobre entendimentos anteriores conflitantes, ressalvada a proposta comercial referida quando expressamente incorporada.",
      ],
    },
    {
      title: "12. Lei aplicável e foro",
      paras: [
        "12.1. Aplica-se a legislação brasileira. As Partes elegem o foro da comarca de Embu Guaçu - SP, ressalvadas as hipóteses de competência legal obrigatória.",
      ],
    },
  ];

  for (const section of sections) {
    y -= 4;
    drawLines(section.title, { bold: true, size: 10.5, gap: 14 });
    for (const para of section.paras) {
      drawLines(para);
      y -= 3;
    }
  }

  y -= 8;
  need(30);
  drawLines(`${input.signedCity}, ${input.signedOnLabel}.`);
  y -= 28;

  need(110);
  const colW = (width - 24) / 2;
  const leftX = MARGIN.left;
  const rightX = MARGIN.left + colW + 24;
  const sigY = y;

  page.drawText("________________________________", {
    x: leftX,
    y: sigY,
    size: 10,
    font,
    color: ink,
  });
  page.drawText("________________________________", {
    x: rightX,
    y: sigY,
    size: 10,
    font,
    color: ink,
  });
  page.drawText("CONTRATANTE", {
    x: leftX,
    y: sigY - 14,
    size: 8,
    font: fontBold,
    color: ink,
  });
  page.drawText("FISAM TECH / CONTRATADA", {
    x: rightX,
    y: sigY - 14,
    size: 8,
    font: fontBold,
    color: ink,
  });
  page.drawText(`Nome: ${input.clientRepName}`, {
    x: leftX,
    y: sigY - 28,
    size: 8,
    font,
    color: ink,
  });
  page.drawText(`Nome: ${FISAM.repName}`, {
    x: rightX,
    y: sigY - 28,
    size: 8,
    font,
    color: ink,
  });
  page.drawText(`Cargo: ${clientTitle}`, {
    x: leftX,
    y: sigY - 40,
    size: 8,
    font,
    color: ink,
  });
  page.drawText(`Cargo: ${FISAM.repTitle}`, {
    x: rightX,
    y: sigY - 40,
    size: 8,
    font,
    color: ink,
  });

  // Annex I
  newPage();
  drawLines("ANEXO I — ESCOPO E ITENS DE SERVIÇO", {
    bold: true,
    size: 12,
    gap: 16,
  });
  drawLines(`Projeto: ${input.projectName}`);
  if (input.proposalNumber) {
    drawLines(`Proposta de origem: ${input.proposalNumber}`);
  }
  y -= 8;

  const colDesc = width * 0.46;
  const colQty = width * 0.1;
  const colUnit = width * 0.1;
  const colPrice = width * 0.17;
  const colTotal = width * 0.17;

  const drawHeader = () => {
    need(18);
    page.drawText("Descrição", {
      x: MARGIN.left,
      y,
      size: 8,
      font: fontBold,
      color: muted,
    });
    page.drawText("Qtd", {
      x: MARGIN.left + colDesc,
      y,
      size: 8,
      font: fontBold,
      color: muted,
    });
    page.drawText("Un", {
      x: MARGIN.left + colDesc + colQty,
      y,
      size: 8,
      font: fontBold,
      color: muted,
    });
    page.drawText("Preço", {
      x: MARGIN.left + colDesc + colQty + colUnit,
      y,
      size: 8,
      font: fontBold,
      color: muted,
    });
    page.drawText("Total", {
      x: MARGIN.left + colDesc + colQty + colUnit + colPrice,
      y,
      size: 8,
      font: fontBold,
      color: muted,
    });
    y -= 14;
  };

  drawHeader();

  for (const item of input.items) {
    const descLines = wrapText(item.description, font, 8.5, colDesc - 6);
    const rowH = Math.max(14, descLines.length * 11 + 4);
    need(rowH + 4);
    let ly = y;
    for (const line of descLines) {
      page.drawText(line, {
        x: MARGIN.left,
        y: ly,
        size: 8.5,
        font,
        color: ink,
      });
      ly -= 11;
    }
    page.drawText(String(item.quantity), {
      x: MARGIN.left + colDesc,
      y,
      size: 8.5,
      font,
      color: ink,
    });
    page.drawText(item.unit || "un", {
      x: MARGIN.left + colDesc + colQty,
      y,
      size: 8.5,
      font,
      color: ink,
    });
    page.drawText(formatMoney(item.unitPrice, input.currency), {
      x: MARGIN.left + colDesc + colQty + colUnit,
      y,
      size: 8,
      font,
      color: ink,
    });
    page.drawText(formatMoney(item.lineTotal, input.currency), {
      x: MARGIN.left + colDesc + colQty + colUnit + colPrice,
      y,
      size: 8,
      font,
      color: ink,
    });
    y -= rowH;
  }

  y -= 10;
  drawLines(
    `Subtotal: ${formatMoney(input.subtotal, input.currency)} · Descontos: ${formatMoney(input.discountTotal, input.currency)} · Total: ${formatMoney(input.total, input.currency)}`,
    { bold: true, size: 10, gap: 14 }
  );

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
