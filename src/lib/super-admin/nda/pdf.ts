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

export type NdaPdfInput = {
  numberDisplay: string;
  clientLegalName: string;
  clientTaxId?: string | null;
  clientAddress?: string | null;
  clientRepName: string;
  clientRepTitle?: string | null;
  projectName: string;
  signedCity: string;
  signedOnLabel: string; // e.g. 10 de novembro de 2026
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

export async function generateUnilateralNdaPdf(
  input: NdaPdfInput
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

  drawLines("ACORDO DE CONFIDENCIALIDADE,", {
    bold: true,
    size: 13,
    gap: 16,
  });
  drawLines("NÃO DIVULGAÇÃO E NÃO UTILIZAÇÃO", {
    bold: true,
    size: 13,
    gap: 16,
  });
  drawLines("Auditoria técnica, acesso a código-fonte e avaliação de sistemas", {
    size: 9,
    color: muted,
    gap: 12,
  });
  y -= 6;

  drawLines(
    `Documento ${input.numberDisplay}. Pelo presente instrumento particular, as partes abaixo identificadas celebram este Acordo de Confidencialidade (“Acordo”):`
  );
  y -= 6;

  drawLines("PARTE REVELADORA / CLIENTE", { bold: true, size: 10, gap: 13 });
  drawLines(
    `${input.clientLegalName}, ${clientTax}, com endereço em ${clientAddress}, representada por ${input.clientRepName}, ${clientTitle}, doravante “CLIENTE”.`
  );
  y -= 4;

  drawLines("PARTE RECEPTORA", { bold: true, size: 10, gap: 13 });
  drawLines(
    `${FISAM.legalName}, CNPJ ${FISAM.cnpj}, com sede em ${FISAM.address}, representada por ${FISAM.repName}, ${FISAM.repTitle}, doravante “FISAM TECH”.`
  );
  drawLines("CLIENTE e FISAM TECH, em conjunto, “Partes”.");
  y -= 8;

  const sections: Array<{ title: string; paras: string[] }> = [
    {
      title: "1. Objeto e finalidade",
      paras: [
        `1.1. O CLIENTE poderá disponibilizar à FISAM TECH informações e materiais para avaliação técnica, diagnóstico de arquitetura, segurança, qualidade, viabilidade de modernização, migração ou eventual contratação de serviços relacionados ao sistema/projeto ${input.projectName} (“Finalidade Autorizada”).`,
        "1.2. O presente Acordo não obriga qualquer Parte a contratar serviços, conceder licença de software ou transferir propriedade intelectual.",
      ],
    },
    {
      title: "2. Informações confidenciais",
      paras: [
        "2.1. São confidenciais todas as informações não públicas reveladas pelo CLIENTE, independentemente do suporte ou marcação, incluindo código-fonte, repositórios, arquitetura, documentação, banco de dados, modelos, algoritmos, fluxos, regras de negócio, integrações, credenciais, planos comerciais, informações financeiras e dados de clientes, pacientes e profissionais.",
        "2.2. Incluem-se cópias, extratos, análises e documentos derivados que revelem tais informações. A FISAM TECH deverá tratar como confidenciais também informações acessadas diretamente em ambientes e sistemas do CLIENTE.",
      ],
    },
    {
      title: "3. Obrigações da FISAM TECH",
      paras: [
        "3.1. Utilizar as Informações Confidenciais exclusivamente para a Finalidade Autorizada.",
        "3.2. Não divulgar, publicar, vender, sublicenciar, ceder ou disponibilizar a terceiros, salvo a colaboradores e prestadores estritamente necessários, vinculados a deveres de sigilo equivalentes, pelos quais responderá nos termos da lei.",
        "3.3. Não reproduzir, reutilizar, incorporar ou adaptar código-fonte, componentes proprietários, algoritmos ou regras de negócio do CLIENTE em produtos próprios ou projetos de terceiros sem autorização prévia e escrita.",
        "3.4. Não realizar engenharia reversa fora do escopo autorizado, exploração comercial, treinamento de modelos de IA com o material recebido ou inserção em serviços públicos de IA sem autorização expressa e escrita do CLIENTE.",
        "3.5. Adotar controles razoáveis de segurança, incluindo acesso por necessidade, autenticação adequada, armazenamento protegido e proibição de compartilhamento de credenciais.",
        "3.6. Comunicar ao CLIENTE, sem demora injustificada, incidentes de segurança conhecidos que possam comprometer as informações recebidas, fornecendo dados disponíveis para avaliação e mitigação.",
      ],
    },
    {
      title: "4. Exceções",
      paras: [
        "4.1. Não se aplicam os deveres de sigilo às informações que a FISAM TECH demonstrar documentalmente: (i) serem públicas sem violação deste Acordo; (ii) já conhecer legitimamente antes da revelação; (iii) receber licitamente de terceiro sem dever de sigilo; ou (iv) desenvolver independentemente, sem uso das Informações Confidenciais.",
        "4.2. Divulgação exigida por lei ou autoridade competente será limitada ao estritamente necessário, com aviso prévio ao CLIENTE quando legalmente permitido.",
      ],
    },
    {
      title: "5. Propriedade intelectual e não reprodução",
      paras: [
        "5.1. Todo código-fonte, documentação, marca, dado, método proprietário e demais ativos preexistentes do CLIENTE permanecem sob titularidade de seus respectivos titulares. Nenhuma disposição concede licença, cessão ou direito de exploração, além do acesso limitado necessário à Finalidade Autorizada.",
        "5.2. A FISAM TECH preserva a titularidade de ferramentas, frameworks, conhecimentos técnicos gerais, metodologias, templates e componentes preexistentes ou desenvolvidos independentemente, desde que não incorporem ou revelem Informações Confidenciais do CLIENTE.",
        "5.3. A titularidade de eventuais entregáveis e desenvolvimentos futuros será definida em contrato específico.",
      ],
    },
    {
      title: "6. Dados pessoais e informações de saúde",
      paras: [
        "6.1. Se houver acesso a dados pessoais, especialmente dados sensíveis de saúde, as Partes observarão a Lei nº 13.709/2018 (LGPD), restringindo o tratamento ao mínimo necessário e às instruções documentadas e legítimas do CLIENTE.",
        "6.2. Sempre que possível, o CLIENTE fornecerá dados fictícios, anonimizados ou mascarados para a análise. O acesso a dados reais de pacientes dependerá de necessidade justificada, controles adequados e definição prévia dos papéis e responsabilidades das Partes.",
        "6.3. Caso a avaliação envolva tratamento sistemático de dados pessoais, as Partes poderão firmar instrumento complementar de tratamento de dados (DPA), inclusive sobre suboperadores, retenção e resposta a incidentes.",
      ],
    },
    {
      title: "7. Acesso e segurança operacional",
      paras: [
        "7.1. O CLIENTE definirá os acessos autorizados, preferencialmente com permissões de leitura e credenciais individuais, podendo revogá-los a qualquer momento.",
        "7.2. A FISAM TECH não alterará sistemas produtivos, não extrairá bases integrais e não executará testes invasivos sem autorização específica e escrita.",
        "7.3. O CLIENTE declara possuir legitimidade para disponibilizar os materiais e autorizar sua análise, sem prejuízo de direitos de terceiros.",
      ],
    },
    {
      title: "8. Devolução e eliminação",
      paras: [
        "8.1. Mediante solicitação do CLIENTE ou encerramento da Finalidade Autorizada, a FISAM TECH cessará o uso e, em até 15 (quinze) dias corridos, devolverá ou eliminará as cópias sob seu controle, confirmando por escrito quando solicitado.",
        "8.2. Poderão ser preservados registros exigidos por lei ou cópias residuais em backups automáticos, desde que protegidos, sem uso ativo e eliminados segundo os ciclos regulares de retenção.",
      ],
    },
    {
      title: "9. Vigência e sobrevivência",
      paras: [
        "9.1. Este Acordo entra em vigor na data da última assinatura e permanecerá vigente por 12 (doze) meses, podendo ser prorrogado por escrito.",
        "9.2. Os deveres de confidencialidade e não utilização sobreviverão por 5 (cinco) anos após seu término; segredos de negócio permanecerão protegidos enquanto mantiverem essa natureza, observada a legislação aplicável. Obrigações legais relativas a dados pessoais subsistirão pelo prazo exigido em lei.",
      ],
    },
    {
      title: "10. Responsabilidade",
      paras: [
        "10.1. A Parte que descumprir este Acordo responderá pelos danos diretos comprovadamente causados, na forma da legislação aplicável, sem prejuízo de medidas judiciais para cessar divulgação ou utilização indevida.",
        "10.2. Este Acordo não estabelece multa contratual automática nem obrigação de resultado quanto à viabilidade técnica do sistema.",
      ],
    },
    {
      title: "11. Disposições gerais",
      paras: [
        "11.1. Alterações deverão ser formalizadas por escrito, inclusive por assinatura eletrônica.",
        "11.2. A eventual tolerância não implica renúncia a direitos. Se uma disposição for inválida, as demais permanecerão em vigor.",
        "11.3. Este Acordo não constitui sociedade, representação, exclusividade ou vínculo empregatício entre as Partes.",
      ],
    },
    {
      title: "12. Lei aplicável e foro",
      paras: [
        "12.1. Aplica-se a legislação brasileira. As Partes elegem o foro da comarca de Embu Guaçu - SP, ressalvadas as hipóteses de competência legal obrigatória, para dirimir controvérsias decorrentes deste Acordo.",
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

  page.drawText("CLIENTE / PARTE REVELADORA", {
    x: leftX,
    y: sigY - 14,
    size: 8,
    font: fontBold,
    color: ink,
  });
  page.drawText("FISAM TECH / PARTE RECEPTORA", {
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
