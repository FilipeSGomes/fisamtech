import { z } from "zod";

export const BID_DETAIL_KEYS = [
  "orgao",
  "edital",
  "itemTr",
  "objeto",
  "prazoExecucao",
  "prazoGarantia",
  "formaExecucao",
  "pagamento",
  "metodologia",
  "cronograma",
  "equipe",
  "declaracoes",
] as const;

export type BidDetailKey = (typeof BID_DETAIL_KEYS)[number];

export type ProposalBidDetails = Partial<Record<BidDetailKey, string>>;

export const BID_DETAIL_FIELDS: Array<{
  key: BidDetailKey;
  label: string;
  placeholder?: string;
  /** Process identifiers stay on one row. Longer answers use a textarea. */
  group: "process" | "detail";
  rows?: number;
}> = [
  {
    key: "orgao",
    label: "Órgão",
    placeholder: "Órgão ou entidade licitante",
    group: "process",
  },
  {
    key: "edital",
    label: "Número do edital",
    placeholder: "Ex.: PE 001/2026",
    group: "process",
  },
  {
    key: "itemTr",
    label: "Item do TR",
    placeholder: "Ex.: Item 3",
    group: "process",
  },
  {
    key: "objeto",
    label: "Objeto",
    placeholder: "Descrição do objeto como no termo de referência",
    group: "detail",
    rows: 4,
  },
  {
    key: "prazoExecucao",
    label: "Prazo de execução",
    placeholder: "Ex.: 90 dias corridos",
    group: "detail",
    rows: 2,
  },
  {
    key: "prazoGarantia",
    label: "Prazo de garantia",
    placeholder: "Ex.: 12 meses após o aceite",
    group: "detail",
    rows: 2,
  },
  {
    key: "formaExecucao",
    label: "Local ou forma de execução",
    placeholder: "Presencial, remoto ou híbrido, e o local",
    group: "detail",
    rows: 3,
  },
  {
    key: "pagamento",
    label: "Condições de pagamento",
    placeholder: "Medição, nota fiscal e prazo",
    group: "detail",
    rows: 3,
  },
  {
    key: "metodologia",
    label: "Metodologia",
    group: "detail",
    rows: 4,
  },
  {
    key: "cronograma",
    label: "Cronograma",
    group: "detail",
    rows: 4,
  },
  {
    key: "equipe",
    label: "Equipe",
    group: "detail",
    rows: 3,
  },
  {
    key: "declaracoes",
    label: "Declarações e observações",
    placeholder: "Tributos inclusos, validade e condições do edital",
    group: "detail",
    rows: 4,
  },
];

/** PDF prints these labels, in this order, and only when the text is filled. */
export const BID_DETAIL_BLOCKS = BID_DETAIL_FIELDS.map(({ key, label }) => ({
  key,
  label,
}));

const optionalText = z.string().optional().nullable();

export const bidDetailsSchema = z.object({
  orgao: optionalText,
  edital: optionalText,
  itemTr: optionalText,
  objeto: optionalText,
  prazoExecucao: optionalText,
  prazoGarantia: optionalText,
  formaExecucao: optionalText,
  pagamento: optionalText,
  metodologia: optionalText,
  cronograma: optionalText,
  equipe: optionalText,
  declaracoes: optionalText,
});

export function normalizeBidDetails(input: unknown): ProposalBidDetails {
  let value = input;
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return {};
    try {
      value = JSON.parse(trimmed);
    } catch {
      return {};
    }
  }
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};

  const record = value as Record<string, unknown>;
  const details: ProposalBidDetails = {};
  for (const key of BID_DETAIL_KEYS) {
    const raw = record[key];
    if (typeof raw !== "string") continue;
    const trimmed = raw.trim();
    if (trimmed) details[key] = trimmed;
  }
  return details;
}

export function hasBidDetails(
  details: ProposalBidDetails | null | undefined
): boolean {
  return Object.keys(normalizeBidDetails(details)).length > 0;
}
