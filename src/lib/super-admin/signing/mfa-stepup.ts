import { adminQuery } from "@/lib/db";
import { decryptMfaSecret, verifyTotp } from "@/lib/super-admin/auth/mfa";
import { markSessionMfaVerified } from "@/lib/super-admin/auth/session";

export class MfaStepUpError extends Error {
  status = 400;
  constructor(message: string) {
    super(message);
    this.name = "MfaStepUpError";
  }
}

/**
 * Live TOTP challenge using the same MFA secret as login/enrollment.
 * On success, refreshes mfa_verified_at on the current session.
 */
export async function verifyMfaStepUp(opts: {
  userId: string;
  sessionToken: string;
  totp: string;
}): Promise<{ steppedUpAt: string }> {
  const token = (opts.totp || "").replace(/\s/g, "");
  if (!/^\d{6}$/.test(token)) {
    throw new MfaStepUpError("Informe o código MFA de 6 dígitos do autenticador");
  }

  const result = await adminQuery<{
    mfa_enabled: boolean;
    mfa_secret: string | null;
  }>(
    `select mfa_enabled, mfa_secret from admin_users where id = $1 limit 1`,
    [opts.userId]
  );
  const user = result.rows[0];
  if (!user) throw new MfaStepUpError("Usuário não encontrado");
  if (!user.mfa_enabled || !user.mfa_secret) {
    throw new MfaStepUpError("Ative o MFA antes de assinar documentos");
  }

  const secret = decryptMfaSecret(user.mfa_secret);
  if (!verifyTotp(secret, token)) {
    throw new MfaStepUpError("Código MFA inválido ou expirado");
  }

  await markSessionMfaVerified(opts.sessionToken);
  return { steppedUpAt: new Date().toISOString() };
}
