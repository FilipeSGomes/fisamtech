import { NextRequest, NextResponse } from "next/server";
import { listProposalTemplates } from "@/lib/super-admin/proposals/service";
import { jsonError, requireAdminApi } from "@/lib/super-admin/http";

export async function GET(req: NextRequest) {
  try {
    await requireAdminApi(req, "proposals:read");
    const templates = await listProposalTemplates();
    return NextResponse.json({ templates });
  } catch (error) {
    return jsonError(error);
  }
}
