import { describe, expect, it } from "vitest";
import {
  fromCents,
  lineTotalCents,
  sumCents,
  toCents,
} from "@/lib/super-admin/proposals/money";
import { hashPassword, verifyPassword } from "@/lib/super-admin/auth/password";
import { hasPermission } from "@/lib/super-admin/rbac/authorize";
import type { AdminSessionUser } from "@/lib/super-admin/auth/session";

describe("money", () => {
  it("rounds to cents deterministically", () => {
    expect(toCents(10.005)).toBe(1001);
    expect(fromCents(1001)).toBe("10.01");
  });

  it("computes line totals without float drift", () => {
    const line = lineTotalCents({
      quantity: 3,
      unitPrice: "1500.00",
      discount: "100.00",
    });
    expect(line).toBe(440000);
    expect(fromCents(sumCents([line, line]))).toBe("8800.00");
  });
});

describe("password", () => {
  it("hashes and verifies with scrypt", () => {
    const hash = hashPassword("correct-horse-battery");
    expect(verifyPassword("correct-horse-battery", hash)).toBe(true);
    expect(verifyPassword("wrong", hash)).toBe(false);
  });
});

describe("rbac", () => {
  const sales: AdminSessionUser = {
    id: "1",
    email: "s@fisamtech.com",
    name: "Sales",
    status: "active",
    mfaEnabled: false,
    roles: ["SALES"],
    permissions: ["leads:read", "leads:update"],
    sessionId: "s",
    mfaVerified: false,
  };

  it("allows listed permissions and denies others", () => {
    expect(hasPermission(sales, "leads:read")).toBe(true);
    expect(hasPermission(sales, "roles:manage")).toBe(false);
  });

  it("grants all to SUPER_ADMIN", () => {
    const sa = { ...sales, roles: ["SUPER_ADMIN"], permissions: [] };
    expect(hasPermission(sa, "roles:manage")).toBe(true);
  });
});
