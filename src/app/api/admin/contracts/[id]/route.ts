import { NextRequest, NextResponse } from "next/server";
import { jsonError, requireAdminApi } from "@/lib/super-admin/http";
import { getContract } from "@/lib/super-admin/contracts/service";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, ctx: Ctx) {
  try {
    await requireAdminApi(req, "contracts:read");
    const { id } = await ctx.params;
    const contract = await getContract(id);
    if (!contract) {
      return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
    }
    const { pdf_bytes: _bytes, ...safe } = contract as Record<string, unknown>;
    void _bytes;
    return NextResponse.json(safe);
  } catch (error) {
    return jsonError(error);
  }
}
