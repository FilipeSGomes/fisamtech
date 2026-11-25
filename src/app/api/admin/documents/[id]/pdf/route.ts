import { NextRequest, NextResponse } from "next/server";
import { jsonError, requireAdminApi } from "@/lib/super-admin/http";
import { loadSignedDocumentPdf } from "@/lib/super-admin/signing/sign-document";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminApi(req, "documents:read");
    const { id } = await ctx.params;
    const doc = await loadSignedDocumentPdf(id);
    if (!doc) {
      return NextResponse.json(
        { error: "Documento não encontrado" },
        { status: 404 }
      );
    }
    return new NextResponse(new Uint8Array(doc.bytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${doc.filename}"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    return jsonError(error);
  }
}
