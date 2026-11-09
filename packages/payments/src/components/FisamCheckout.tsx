"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  EmbeddedCheckout,
  EmbeddedCheckoutProvider,
} from "@stripe/react-stripe-js";
import { formatMoney } from "../config";
import type { FisamCheckoutProps } from "../types";

/**
 * FisamCheckout — embeds Stripe Embedded or Mercado Pago Transparent UI.
 * Public keys only on client; never secrets.
 */
export function FisamCheckout({
  session,
  companyName = "FISAM TECH",
  serviceLabel,
  termsUrl,
  privacyUrl,
  cancelPolicyUrl,
  onComplete,
  onError,
  locale,
}: FisamCheckoutProps) {
  const [mpReady, setMpReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const priceLabel = useMemo(
    () => formatMoney(session.amountCents, session.currency),
    [session.amountCents, session.currency]
  );

  useEffect(() => {
    if (session.configError) {
      setError(session.configError);
      onError?.(session.configError);
    }
  }, [session.configError, onError]);

  // Mercado Pago Wallet Brick (Transparent path) — load SDK when preference present
  useEffect(() => {
    if (session.provider !== "mercadopago_transparent") return;
    if (!session.preferenceId || !session.publicKey) {
      if (!session.configError) {
        setError(
          "Mercado Pago public key or preference missing. Set NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY_* and access token."
        );
      }
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        // Dynamic script load for MP SDK Bricks
        await loadScript("https://sdk.mercadopago.com/js/v2");
        if (cancelled) return;
        const MP = (window as unknown as { MercadoPago: new (key: string, opts?: { locale?: string }) => { bricks: () => { create: (name: string, target: string, settings: unknown) => Promise<unknown> } } }).MercadoPago;
        const mp = new MP(session.publicKey!, { locale: locale || "es" });
        const bricks = mp.bricks();
        await bricks.create("wallet", "fisam-mp-wallet-brick", {
          initialization: { preferenceId: session.preferenceId },
          customization: { texts: { valueProp: "smart_option" } },
        });
        if (!cancelled) setMpReady(true);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Mercado Pago Brick failed";
        setError(msg);
        onError?.(msg);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [session, locale, onError]);

  const stripePromise = useMemo(() => {
    if (session.provider !== "stripe_embedded" || !session.publicKey) return null;
    return loadStripe(session.publicKey);
  }, [session.provider, session.publicKey]);

  const fetchClientSecret = useCallback(async () => {
    if (!session.clientSecret) throw new Error("Missing Stripe client secret");
    return session.clientSecret;
  }, [session.clientSecret]);

  return (
    <div className="fisam-checkout" data-provider={session.provider}>
      <header className="fisam-checkout__header">
        <p className="fisam-checkout__eyebrow">{companyName}</p>
        <h2 className="fisam-checkout__title">{serviceLabel}</h2>
        <p className="fisam-checkout__price">{priceLabel}</p>
        <p className="fisam-checkout__meta">
          {session.currency} · {session.country} ·{" "}
          {session.provider === "stripe_embedded"
            ? "Stripe Embedded"
            : "Mercado Pago Transparent"}
        </p>
      </header>

      {error && (
        <div className="fisam-checkout__error" role="alert">
          <p>{error}</p>
          <p className="fisam-checkout__hint">
            Fill payment env vars in `.env.local` (see `.env.example`). Checkout
            stays on-site once keys are present.
          </p>
        </div>
      )}

      {!error && session.provider === "stripe_embedded" && stripePromise && session.clientSecret && (
        <div className="fisam-checkout__embed">
          <EmbeddedCheckoutProvider
            stripe={stripePromise}
            options={{ fetchClientSecret }}
          >
            <EmbeddedCheckout />
          </EmbeddedCheckoutProvider>
        </div>
      )}

      {!error && session.provider === "mercadopago_transparent" && (
        <div className="fisam-checkout__embed">
          {!mpReady && <p className="fisam-checkout__loading">Loading secure checkout…</p>}
          <div id="fisam-mp-wallet-brick" />
        </div>
      )}

      <footer className="fisam-checkout__trust">
        <p>Secure in-site checkout. No dark patterns — cancel anytime before payment.</p>
        <ul>
          {termsUrl && (
            <li>
              <a href={termsUrl}>Terms</a>
            </li>
          )}
          {privacyUrl && (
            <li>
              <a href={privacyUrl}>Privacy</a>
            </li>
          )}
          {cancelPolicyUrl && (
            <li>
              <a href={cancelPolicyUrl}>Cancel / refund policy</a>
            </li>
          )}
        </ul>
        <button
          type="button"
          className="fisam-checkout__done"
          onClick={() => onComplete?.({ status: "navigating", transactionId: session.externalId })}
        >
          I’ve completed payment — continue
        </button>
      </footer>
    </div>
  );
}

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) {
      resolve();
      return;
    }
    const s = document.createElement("script");
    s.src = src;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.body.appendChild(s);
  });
}

export { formatMoney };
