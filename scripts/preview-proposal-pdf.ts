import { writeFileSync } from "node:fs";
import { generateProposalPdf } from "../src/lib/super-admin/proposals/pdf";

async function main() {
  const buf = await generateProposalPdf({
    numberDisplay: "FISAM-2026-0001",
    title: "INTEGRAÇÃO DISCORD SERVIDOR CS2",
    version: 1,
    currency: "BRL",
    companyName: "Servidor CS2",
    contactName: "Paulo Henrique",
    items: [
      {
        description: "Integração Discord + CS2",
        quantity: 1,
        unit: "un",
        unitPrice: "1500.00",
        discount: "0.00",
        lineTotal: "1500.00",
      },
      {
        description: "Filas e divisão automática de equipes",
        quantity: 1,
        unit: "un",
        unitPrice: "1200.00",
        discount: "0.00",
        lineTotal: "1200.00",
      },
      {
        description: "Dashboard admin e moderação",
        quantity: 1,
        unit: "un",
        unitPrice: "900.00",
        discount: "0.00",
        lineTotal: "900.00",
      },
      {
        description: "Rankings e estatísticas",
        quantity: 1,
        unit: "un",
        unitPrice: "800.00",
        discount: "0.00",
        lineTotal: "800.00",
      },
      {
        description: "Notificações e webhooks",
        quantity: 1,
        unit: "un",
        unitPrice: "700.00",
        discount: "0.00",
        lineTotal: "700.00",
      },
      {
        description: "Suporte e implantação",
        quantity: 1,
        unit: "un",
        unitPrice: "1800.00",
        discount: "0.00",
        lineTotal: "1800.00",
      },
    ],
    subtotal: "6900.00",
    discountTotal: "0.00",
    total: "6900.00",
  });
  writeFileSync("/tmp/fisam-proposta-preview.pdf", buf);
  console.log("ok", buf.length);
}

main();
