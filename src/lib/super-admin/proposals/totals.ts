import {
  fromCents,
  lineTotalCents,
  sumCents,
  toCents,
  type MoneyCents,
} from "@/lib/super-admin/proposals/money";

export type ProposalItemInput = {
  description: string;
  quantity: number;
  unit?: string;
  unitPrice: number | string;
  discount?: number | string;
  position?: number;
};

export type ComputedProposalItem = {
  description: string;
  quantity: number;
  unit: string;
  unitPrice: string;
  discount: string;
  lineTotal: string;
  lineTotalCents: MoneyCents;
  position: number;
};

export type ComputedProposalTotals = {
  items: ComputedProposalItem[];
  subtotal: string;
  discountTotal: string;
  total: string;
  subtotalCents: MoneyCents;
  discountTotalCents: MoneyCents;
  totalCents: MoneyCents;
};

export function computeProposalTotals(
  items: ProposalItemInput[]
): ComputedProposalTotals {
  if (!items.length) {
    return {
      items: [],
      subtotal: "0.00",
      discountTotal: "0.00",
      total: "0.00",
      subtotalCents: 0,
      discountTotalCents: 0,
      totalCents: 0,
    };
  }

  const computed: ComputedProposalItem[] = items.map((item, index) => {
    const description = item.description?.trim();
    if (!description) throw new Error(`Item ${index + 1}: descrição obrigatória`);
    if (!Number.isFinite(item.quantity) || item.quantity <= 0) {
      throw new Error(`Item ${index + 1}: quantidade inválida`);
    }
    const unitPriceCents = toCents(item.unitPrice);
    const discountCents = toCents(item.discount ?? 0);
    const line = lineTotalCents({
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      discount: item.discount ?? 0,
    });
    return {
      description,
      quantity: item.quantity,
      unit: item.unit?.trim() || "un",
      unitPrice: fromCents(unitPriceCents),
      discount: fromCents(discountCents),
      lineTotal: fromCents(line),
      lineTotalCents: line,
      position: item.position ?? index,
    };
  });

  const discountTotalCents = sumCents(
    computed.map((i) => toCents(i.discount))
  );
  const totalCents = sumCents(computed.map((i) => i.lineTotalCents));
  const subtotalCents = totalCents + discountTotalCents;

  return {
    items: computed,
    subtotal: fromCents(subtotalCents),
    discountTotal: fromCents(discountTotalCents),
    total: fromCents(totalCents),
    subtotalCents,
    discountTotalCents,
    totalCents,
  };
}
