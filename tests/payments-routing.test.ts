import { describe, expect, it } from "vitest";
import {
  resolveRoute,
  getDiscoveryPrice,
  LATAM_MP_COUNTRIES,
  PRICES,
} from "@fisamtech/payments";

describe("@fisamtech/payments routing", () => {
  it("routes LATAM to Mercado Pago Transparent", () => {
    for (const c of LATAM_MP_COUNTRIES) {
      const route = resolveRoute(c);
      expect(route.provider).toBe("mercadopago_transparent");
    }
  });

  it("never routes US/EU to Mercado Pago", () => {
    expect(resolveRoute("US").provider).toBe("stripe_embedded");
    expect(resolveRoute("GB").provider).toBe("stripe_embedded");
    expect(resolveRoute("DE").provider).toBe("stripe_embedded");
    expect(resolveRoute("FR").currency).toBe("EUR");
  });

  it("maps LATAM currencies correctly", () => {
    expect(resolveRoute("AR").currency).toBe("ARS");
    expect(resolveRoute("MX").currency).toBe("MXN");
    expect(resolveRoute("CO").currency).toBe("COP");
    expect(resolveRoute("CL").currency).toBe("CLP");
    expect(resolveRoute("PE").currency).toBe("PEN");
    expect(resolveRoute("UY").currency).toBe("UYU");
    expect(resolveRoute("BR").currency).toBe("BRL");
  });

  it("has hypothesis prices for all discovery currencies", () => {
    const keys = Object.keys(PRICES.technical_discovery);
    expect(keys).toEqual(
      expect.arrayContaining([
        "USD",
        "EUR",
        "GBP",
        "BRL",
        "ARS",
        "MXN",
        "COP",
        "CLP",
        "PEN",
        "UYU",
      ])
    );
    expect(getDiscoveryPrice("USD").amount).toBe(9900);
    expect(getDiscoveryPrice("GBP").amount).toBe(8900);
  });
});
