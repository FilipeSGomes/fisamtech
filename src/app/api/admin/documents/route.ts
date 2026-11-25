import { NextRequest, NextResponse } from "next/server";
import { jsonError, requireAdminApi } from "@/lib/super-admin/http";
import { listSignedDocuments } from "@/lib/super-admin/signing/sign-document";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    await requireAdminApi(req, "documents:read");
    const items = await listSignedDocuments({ limit: 50 });
    return NextResponse.json({ items });
  } catch (error) {
    return jsonError(error);
  }
}
