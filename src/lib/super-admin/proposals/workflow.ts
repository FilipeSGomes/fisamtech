export const PROPOSAL_STATUSES = [
  "DRAFT",
  "IN_REVIEW",
  "APPROVED",
  "SENT",
  "VIEWED",
  "ACCEPTED",
  "REJECTED",
  "EXPIRED",
  "CANCELLED",
] as const;

export type ProposalStatus = (typeof PROPOSAL_STATUSES)[number];

export const PROPOSAL_STATUS_LABELS: Record<ProposalStatus, string> = {
  DRAFT: "Rascunho",
  IN_REVIEW: "Em revisão",
  APPROVED: "Aprovada",
  SENT: "Enviada",
  VIEWED: "Visualizada",
  ACCEPTED: "Aceita",
  REJECTED: "Recusada",
  EXPIRED: "Expirada",
  CANCELLED: "Cancelada",
};

/** Allowed transitions. Backend rejects anything outside this map. */
export const PROPOSAL_TRANSITIONS: Record<ProposalStatus, ProposalStatus[]> = {
  DRAFT: ["IN_REVIEW", "CANCELLED"],
  IN_REVIEW: ["DRAFT", "APPROVED", "CANCELLED"],
  APPROVED: ["SENT", "DRAFT", "CANCELLED"],
  SENT: ["VIEWED", "ACCEPTED", "REJECTED", "EXPIRED", "CANCELLED"],
  VIEWED: ["ACCEPTED", "REJECTED", "EXPIRED", "CANCELLED"],
  ACCEPTED: [],
  REJECTED: ["DRAFT"],
  EXPIRED: ["DRAFT"],
  CANCELLED: ["DRAFT"],
};

export function assertProposalTransition(
  from: ProposalStatus,
  to: ProposalStatus
): void {
  if (from === to) return;
  const allowed = PROPOSAL_TRANSITIONS[from] || [];
  if (!allowed.includes(to)) {
    throw new Error(
      `Transição inválida: ${PROPOSAL_STATUS_LABELS[from]} → ${PROPOSAL_STATUS_LABELS[to]}`
    );
  }
}

export function requiresApprovePermission(to: ProposalStatus): boolean {
  return to === "APPROVED";
}

export function requiresSendPermission(to: ProposalStatus): boolean {
  return to === "SENT";
}
