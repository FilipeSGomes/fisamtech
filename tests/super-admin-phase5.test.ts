import { describe, expect, it } from "vitest";
import {
  fromCents,
  lineTotalCents,
  sumCents,
} from "@/lib/super-admin/proposals/money";
import { computeProposalTotals } from "@/lib/super-admin/proposals/totals";
import {
  assertProposalTransition,
  PROPOSAL_TRANSITIONS,
} from "@/lib/super-admin/proposals/workflow";
import { LEAD_STATUSES } from "@/lib/super-admin/crm/lead-status";
import {
  AuthorizationError,
  AuthenticationError,
  canAccessOwnedResource,
  hasPermission,
  requirePermission,
} from "@/lib/super-admin/rbac/authorize";
import type { AdminSessionUser } from "@/lib/super-admin/auth/session";

const sales: AdminSessionUser = {
  id: "sales-1",
  email: "sales@fisamtech.com",
  name: "Sales",
  status: "active",
  mfaEnabled: false,
  roles: ["SALES"],
  permissions: ["leads:read", "leads:update", "proposals:read"],
  sessionId: "s1",
  mfaVerified: false,
};

const admin: AdminSessionUser = {
  ...sales,
  id: "admin-1",
  roles: ["ADMIN"],
  permissions: ["leads:read", "leads:update", "roles:manage"],
};

describe("proposal totals", () => {
  it("computes deterministic totals from items", () => {
    const totals = computeProposalTotals([
      {
        description: "Discovery",
        quantity: 2,
        unitPrice: "1500.50",
        discount: "100.00",
      },
      {
        description: "Arquitetura",
        quantity: 1,
        unitPrice: "3200.00",
        discount: "0",
      },
    ]);
    // line1: round(150050*2)-10000 = 300100-10000 = 290100
    // line2: 320000
    expect(totals.totalCents).toBe(610100);
    expect(totals.total).toBe("6101.00");
    expect(totals.discountTotal).toBe("100.00");
    expect(totals.subtotal).toBe("6201.00");
  });

  it("rejects discount above line", () => {
    expect(() =>
      computeProposalTotals([
        { description: "X", quantity: 1, unitPrice: "10", discount: "20" },
      ])
    ).toThrow(/Discount/);
  });
});

describe("proposal workflow", () => {
  it("allows approved transitions and denies others", () => {
    expect(PROPOSAL_TRANSITIONS.DRAFT).toContain("IN_REVIEW");
    expect(() => assertProposalTransition("DRAFT", "SENT")).toThrow(
      /Transição inválida/
    );
    expect(() => assertProposalTransition("APPROVED", "SENT")).not.toThrow();
  });
});

describe("lead statuses", () => {
  it("includes required CRM pipeline statuses", () => {
    expect(LEAD_STATUSES).toEqual(
      expect.arrayContaining([
        "NEW",
        "QUALIFIED",
        "PROPOSAL",
        "WON",
        "LOST",
      ])
    );
  });
});

describe("authz deny", () => {
  it("denies missing permission", () => {
    expect(hasPermission(sales, "roles:manage")).toBe(false);
    expect(() => requirePermission(sales, "roles:manage")).toThrow(
      AuthorizationError
    );
  });

  it("denies unauthenticated", () => {
    expect(() => requirePermission(null, "leads:read")).toThrow(
      AuthenticationError
    );
  });

  it("enforces ownership for SALES", () => {
    expect(canAccessOwnedResource(sales, "sales-1")).toBe(true);
    expect(canAccessOwnedResource(sales, "other")).toBe(false);
    expect(canAccessOwnedResource(admin, "other")).toBe(true);
  });
});

describe("money helpers still consistent", () => {
  it("sums line totals", () => {
    const a = lineTotalCents({ quantity: 1.5, unitPrice: "100.00" });
    expect(a).toBe(15000);
    expect(fromCents(sumCents([a, a]))).toBe("300.00");
  });
});
