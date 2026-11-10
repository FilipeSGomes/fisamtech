import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authenticateAdmin } from "@/lib/super-admin/auth/login";
import {
  ADMIN_SESSION_COOKIE,
  sessionCookieOptions,
} from "@/lib/super-admin/auth/session";
import { clientMeta, jsonError } from "@/lib/super-admin/http";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  totp: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = schema.parse(await req.json());
    const meta = clientMeta(req);
    const result = await authenticateAdmin({
      email: body.email,
      password: body.password,
      totp: body.totp,
      ip: meta.ip,
      userAgent: meta.userAgent,
    });
    if (!result.ok) {
      return NextResponse.json(
        { error: result.error, requiresTotp: result.requiresTotp ?? false },
        { status: 401 }
      );
    }
    const res = NextResponse.json({
      ok: true,
      requiresMfaSetup: result.requiresMfaSetup,
      userId: result.userId,
    });
    res.cookies.set(
      ADMIN_SESSION_COOKIE,
      result.token,
      sessionCookieOptions(result.expiresAt)
    );
    return res;
  } catch (error) {
    return jsonError(error);
  }
}
