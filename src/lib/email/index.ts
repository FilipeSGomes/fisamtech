/**
 * Email stubs — wire to Resend when RESEND_API_KEY is set.
 * Templates live in /emails as markdown for review.
 */

export type EmailTemplateId =
  | "payment_confirmation"
  | "booking_unlocked"
  | "internal_briefing"
  | "partners_ack";

export async function sendEmail(opts: {
  to: string;
  subject: string;
  template: EmailTemplateId;
  vars: Record<string, string>;
}): Promise<{ sent: boolean; reason?: string }> {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.info("[email:stub]", opts.template, opts.to, opts.subject, opts.vars);
    return { sent: false, reason: "RESEND_API_KEY not set" };
  }

  // Minimal Resend HTTP call — from address must be verified in Resend dashboard
  const html = renderStubHtml(opts.template, opts.vars);
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "FISAM TECH <contato@fisamtech.com>",
      to: [opts.to],
      subject: opts.subject,
      html,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("[email] Resend error", text);
    return { sent: false, reason: text };
  }
  return { sent: true };
}

function renderStubHtml(
  template: EmailTemplateId,
  vars: Record<string, string>
): string {
  const rows = Object.entries(vars)
    .map(([k, v]) => `<tr><td><strong>${k}</strong></td><td>${v}</td></tr>`)
    .join("");
  return `<!doctype html><html><body style="font-family:system-ui,sans-serif;color:#1d1d1f">
  <h1>FISAM TECH — ${template}</h1>
  <table>${rows}</table>
  <p style="color:#7a7a7a;font-size:14px">This is an automated message from FISAM TECH.</p>
  </body></html>`;
}
