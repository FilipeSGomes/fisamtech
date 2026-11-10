"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";

export function BookingUnlock({
  leadId,
  initialToken,
}: {
  leadId?: string;
  initialToken?: string;
}) {
  const t = useTranslations("checkout");
  const [token, setToken] = useState(initialToken ?? "");
  const [waiting, setWaiting] = useState(!initialToken && Boolean(leadId));

  useEffect(() => {
    if (token || !leadId) return;
    let cancelled = false;

    async function poll() {
      for (let attempt = 0; attempt < 6; attempt += 1) {
        try {
          const res = await fetch("/api/booking/unlock", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ leadId }),
          });
          if (cancelled) return;
          if (res.ok) {
            const data = (await res.json()) as { token?: string };
            if (data.token) {
              setToken(data.token);
              setWaiting(false);
              return;
            }
          }
        } catch {
          // webhook may still be in flight
        }
        await new Promise((resolve) => setTimeout(resolve, 2500));
      }
      if (!cancelled) setWaiting(false);
    }

    void poll();
    return () => {
      cancelled = true;
    };
  }, [leadId, token]);

  if (token) {
    return (
      <p style={{ marginTop: 24 }}>
        <Link
          className="btn btn-primary"
          href={`/book?token=${encodeURIComponent(token)}`}
        >
          {t("book")}
        </Link>
      </p>
    );
  }

  return (
    <p className="lead" style={{ marginTop: 16 }}>
      {waiting ? t("successWaiting") : t("successPending")}
    </p>
  );
}
