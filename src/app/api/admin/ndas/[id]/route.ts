import { NextRequest, NextResponse } from "next/server";
import { jsonError, requireAdminApi } from "@/lib/super-admin/http";
import { getNda } from "@/lib/super-admin/nda/service";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, ctx: Ctx) {
  try {
    await requireAdminApi(req, "ndas:read");
    const { id } = await ctx.params;
    const nda = await getNda(id);
    if (!nda) {
      return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
    }
    // Never leak binary pdf_bytes over JSON
    const { pdf_bytes: _bytes, ...safe } = nda as Record<string, unknown>;
    void _bytes;
    return NextResponse.json(safe);
  } catch (error) {
    return jsonError(error);
  }
}
