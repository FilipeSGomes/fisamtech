import { NextRequest, NextResponse } from "next/server";
import QRCode from "qrcode";
import { z } from "zod";
import { completeMfaEnrollment } from "@/lib/super-admin/auth/login";
import { generateTotpSecret } from "@/lib/super-admin/auth/mfa";
import { ADMIN_SESSION_COOKIE } from "@/lib/super-admin/auth/session";
import { getSessionFromRequest, jsonError } from "@/lib/super-admin/http";
import { AuthenticationError } from "@/lib/super-admin/rbac/authorize";

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) throw new AuthenticationError();
    if (!session.roles.includes("SUPER_ADMIN") && session.mfaEnabled) {
      return NextResponse.json({ error: "MFA já ativo" }, { status: 400 });
    }
    const secret = generateTotpSecret(session.email);
    const qrDataUrl = await QRCode.toDataURL(secret.otpauthUrl, {
      errorCorrectionLevel: "M",
      margin: 2,
      width: 240,
      color: { dark: "#0f1724", light: "#ffffff" },
    });
    // secret returned once for enrollment UI; not persisted until POST confirm
    return NextResponse.json({
      secretBase32: secret.secretBase32,
      otpauthUrl: secret.otpauthUrl,
      qrDataUrl,
    });
  } catch (error) {
    return jsonError(error);
  }
}

const confirmSchema = z.object({
  secretBase32: z.string().min(16),
  totp: z.string().min(6).max(8),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) throw new AuthenticationError();
    const body = confirmSchema.parse(await req.json());
    const token = req.cookies.get(ADMIN_SESSION_COOKIE)?.value;
    if (!token) throw new AuthenticationError();
    const result = await completeMfaEnrollment({
      userId: session.id,
      sessionToken: token,
      secretBase32: body.secretBase32,
      totp: body.totp,
    });
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
