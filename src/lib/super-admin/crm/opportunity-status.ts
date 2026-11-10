export const OPP_STAGES = [
  "QUALIFICATION",
  "DISCOVERY",
  "PROPOSAL",
  "NEGOTIATION",
  "WON",
  "LOST",
] as const;

export type OppStage = (typeof OPP_STAGES)[number];

export const OPP_STAGE_LABELS: Record<OppStage, string> = {
  QUALIFICATION: "Qualificação",
  DISCOVERY: "Discovery",
  PROPOSAL: "Proposta",
  NEGOTIATION: "Negociação",
  WON: "Ganha",
  LOST: "Perdida",
};

export const OPP_STATUSES = ["OPEN", "WON", "LOST", "CANCELLED"] as const;
export type OppStatus = (typeof OPP_STATUSES)[number];
