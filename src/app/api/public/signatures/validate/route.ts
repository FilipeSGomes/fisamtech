import { NextRequest, NextResponse } from "next/server";
import { lookupProposalAuthenticity } from "@/lib/super-admin/proposals/service";
import { lookupSignedDocumentAuthenticity } from "@/lib/super-admin/signing/sign-document";
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
    const signed = await lookupSignedDocumentAuthenticity(code);
    if (signed.valid) {
      return NextResponse.json({
        valid: true,
        authenticityCode: signed.authenticityCode,
        signerName: signed.signerName,
        signerEmail: signed.signerEmail,
        signedAt: signed.signedAt,
        documentTitle: signed.documentTitle,
        documentKind: signed.documentKind,
        checksumShort: signed.checksumShort,
        proposalNumber: null,
        proposalTitle: null,
        version: null,
      });
    }

    const proposal = await lookupProposalAuthenticity(code);
    return NextResponse.json({
      valid: proposal.valid,
      authenticityCode: proposal.authenticityCode,
      signerName: proposal.signerName,
      signerEmail: proposal.signerEmail,
      signedAt: proposal.signedAt,
      documentTitle: proposal.proposalTitle,
      documentKind: proposal.valid ? "proposal" : null,
      checksumShort: null,
      proposalNumber: proposal.proposalNumber,
      proposalTitle: proposal.proposalTitle,
      version: proposal.version,
    });
  } catch (error) {
    console.error("[public/signatures/validate]", error);
    return NextResponse.json(
      { error: "Falha ao validar código", valid: false },
      { status: 500 }
    );
  }
}
