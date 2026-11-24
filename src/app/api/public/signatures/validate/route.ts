import { NextRequest, NextResponse } from "next/server";
import { lookupProposalAuthenticity } from "@/lib/super-admin/proposals/service";
import { checkSignatureValidateRateLimit } from "@/lib/public/signature-rate-limit";

export const dynamic = "force-dynamic";

function clientKey(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";
  return req.headers.get("x-real-ip") || "unknown";
}

export async function GET(req: NextRequest) {
  const limit = checkSignatureValidateRateLimit(clientKey(req));
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Muitas consultas. Tente novamente em instantes.", valid: false },
      {
        status: 429,
        headers: { "Retry-After": String(limit.retryAfterSec) },
      }
    );
  }

  const code = req.nextUrl.searchParams.get("code") || "";
  if (!code.trim()) {
    return NextResponse.json(
      { error: "Informe o código de autenticidade", valid: false },
      { status: 400 }
    );
  }

  try {
    const result = await lookupProposalAuthenticity(code);
    return NextResponse.json({
      valid: result.valid,
      authenticityCode: result.authenticityCode,
      signerName: result.signerName,
      signerEmail: result.signerEmail,
      signedAt: result.signedAt,
      proposalNumber: result.proposalNumber,
      proposalTitle: result.proposalTitle,
      version: result.version,
    });
  } catch (error) {
    console.error("[public/signatures/validate]", error);
    return NextResponse.json(
      { error: "Falha ao validar código", valid: false },
      { status: 500 }
    );
  }
}
