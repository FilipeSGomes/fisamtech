import { NextRequest, NextResponse } from "next/server";
import { jsonError, requireAdminApi } from "@/lib/super-admin/http";
import { getNda, loadNdaPdf } from "@/lib/super-admin/nda/service";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, ctx: Ctx) {
  try {
    await requireAdminApi(req, "ndas:read");
    const { id } = await ctx.params;
    const nda = await getNda(id);
    if (!nda) {
      return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
    }
    const pdf = await loadNdaPdf(id);
    if (!pdf) {
      return NextResponse.json({ error: "PDF indisponível" }, { status: 404 });
    }
    return new NextResponse(new Uint8Array(pdf.bytes), {
      status: 200,
      headers: {
        "Content-Type": pdf.contentType,
        "Content-Disposition": `attachment; filename="${pdf.numberDisplay}.pdf"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    return jsonError(error);
  }
}
