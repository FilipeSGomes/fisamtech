import { NextRequest, NextResponse } from "next/server";
import {
  ADMIN_SESSION_COOKIE,
  revokeAdminSession,
} from "@/lib/super-admin/auth/session";
import { writeAudit } from "@/lib/super-admin/audit/write";
import { clientMeta, getSessionFromRequest } from "@/lib/super-admin/http";

export async function POST(req: NextRequest) {
  const token = req.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  const session = await getSessionFromRequest(req);
  if (token) await revokeAdminSession(token);
  if (session) {
    await writeAudit({
      action: "LOGOUT",
      actorUserId: session.id,
      ...clientMeta(req),
    });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(0),
  });
  return res;
}
