/**
 * Deterministic money math using integer cents as source of truth in memory.
 * Persist as numeric(14,2) in Postgres.
 */

export type MoneyCents = number;

export function toCents(amount: number | string): MoneyCents {
  const n = typeof amount === "string" ? Number(amount) : amount;
  if (!Number.isFinite(n)) throw new Error("Invalid money amount");
  return Math.round(n * 100);
}

export function fromCents(cents: MoneyCents): string {
  const sign = cents < 0 ? "-" : "";
  const abs = Math.abs(cents);
  const whole = Math.floor(abs / 100);
  const frac = String(abs % 100).padStart(2, "0");
  return `${sign}${whole}.${frac}`;
}

export function lineTotalCents(opts: {
  quantity: number;
  unitPrice: number | string;
  discount?: number | string;
}): MoneyCents {
  const qty = opts.quantity;
  if (!Number.isFinite(qty) || qty < 0) throw new Error("Invalid quantity");
  const unit = toCents(opts.unitPrice);
  const discount = toCents(opts.discount ?? 0);
  // quantity may be fractional (e.g. 1.5) — round after multiply
  const gross = Math.round(unit * qty);
  const net = gross - discount;
  if (net < 0) throw new Error("Discount exceeds line total");
  return net;
}

export function sumCents(values: MoneyCents[]): MoneyCents {
  return values.reduce((a, b) => a + b, 0);
}
