import { NextRequest, NextResponse } from "next/server";
import { listAuditLogs } from "@/lib/super-admin/audit/list";
import { jsonError, requireAdminApi } from "@/lib/super-admin/http";

export async function GET(req: NextRequest) {
  try {
    await requireAdminApi(req, "audit:read");
    const sp = req.nextUrl.searchParams;
    const data = await listAuditLogs({
      q: sp.get("q") || undefined,
      action: sp.get("action") || undefined,
      page: Number(sp.get("page") || 1),
      pageSize: Number(sp.get("pageSize") || 50),
    });
    return NextResponse.json(data);
  } catch (error) {
    return jsonError(error);
  }
}
