export const LEAD_STATUSES = [
  "NEW",
  "CONTACTED",
  "QUALIFIED",
  "DIAGNOSIS",
  "PROPOSAL",
  "NEGOTIATION",
  "WON",
  "LOST",
] as const;

export type LeadStatus = (typeof LEAD_STATUSES)[number];

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  NEW: "Novo",
  CONTACTED: "Contatado",
  QUALIFIED: "Qualificado",
  DIAGNOSIS: "Diagnóstico",
  PROPOSAL: "Proposta",
  NEGOTIATION: "Negociação",
  WON: "Ganho",
  LOST: "Perdido",
};
