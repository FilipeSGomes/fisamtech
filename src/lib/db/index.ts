import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import pg from "pg";

export type LeadInsert = {
  name: string;
  email: string;
  company?: string | null;
  country?: string | null;
  locale: string;
  currency: string;
  role?: string | null;
  challenge?: string | null;
  budget_range?: string | null;
  source: string;
  phone?: string | null;
  metadata?: Record<string, unknown>;
};

export type PaymentUpsert = {
  lead_id?: string | null;
  provider: string;
  transaction_id: string;
  status: string;
  amount_cents?: number | null;
  currency?: string | null;
  service_id?: string;
  raw?: Record<string, unknown>;
};

export type BookingInsert = {
  lead_id: string;
  payment_id?: string | null;
  token_hash: string;
  expires_at: string;
  calendar_url?: string | null;
  status?: string;
};

let supabaseAdmin: SupabaseClient | null | undefined;
let pgPool: pg.Pool | null | undefined;

export function isDbConfigured(): boolean {
  return Boolean(
    process.env.DATABASE_URL ||
      (process.env.NEXT_PUBLIC_SUPABASE_URL &&
        process.env.SUPABASE_SERVICE_ROLE_KEY)
  );
}

function getSupabaseAdmin(): SupabaseClient | null {
  if (supabaseAdmin !== undefined) return supabaseAdmin;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    supabaseAdmin = null;
    return null;
  }
  supabaseAdmin = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return supabaseAdmin;
}

function getPgPool(): pg.Pool | null {
  if (pgPool !== undefined) return pgPool;
  const url = process.env.DATABASE_URL;
  if (!url) {
    pgPool = null;
    return null;
  }
  pgPool = new pg.Pool({ connectionString: url, max: 3 });
  return pgPool;
}

export async function insertLead(
  lead: LeadInsert
): Promise<{ id: string } | { error: string; degraded: true }> {
  const sb = getSupabaseAdmin();
  if (sb) {
    const { data, error } = await sb
      .from("leads")
      .insert({
        name: lead.name,
        email: lead.email,
        company: lead.company ?? null,
        country: lead.country ?? null,
        locale: lead.locale,
        currency: lead.currency,
        role: lead.role ?? null,
        challenge: lead.challenge ?? null,
        budget_range: lead.budget_range ?? null,
        source: lead.source,
        phone: lead.phone ?? null,
        metadata: lead.metadata ?? {},
      })
      .select("id")
      .single();
    if (error) return { error: error.message, degraded: true };
    return { id: data.id };
  }

  const pool = getPgPool();
  if (pool) {
    const result = await pool.query<{ id: string }>(
      `insert into leads (name, email, company, country, locale, currency, role, challenge, budget_range, source, phone, metadata)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12::jsonb)
       returning id`,
      [
        lead.name,
        lead.email,
        lead.company ?? null,
        lead.country ?? null,
        lead.locale,
        lead.currency,
        lead.role ?? null,
        lead.challenge ?? null,
        lead.budget_range ?? null,
        lead.source,
        lead.phone ?? null,
        JSON.stringify(lead.metadata ?? {}),
      ]
    );
    return { id: result.rows[0].id };
  }

  // Graceful degrade: ephemeral id for local funnel testing without DB
  const id = crypto.randomUUID();
  console.warn(
    "[db] DATABASE_URL / Supabase not configured — lead stored ephemerally:",
    id,
    lead.email
  );
  return { id, error: "Database not configured", degraded: true };
}

export async function upsertPayment(
  payment: PaymentUpsert
): Promise<{ id: string } | { error: string }> {
  const sb = getSupabaseAdmin();
  if (sb) {
    const { data, error } = await sb
      .from("payments")
      .upsert(
        {
          lead_id: payment.lead_id ?? null,
          provider: payment.provider,
          transaction_id: payment.transaction_id,
          status: payment.status,
          amount_cents: payment.amount_cents ?? null,
          currency: payment.currency ?? null,
          service_id: payment.service_id ?? "technical_discovery",
          raw: payment.raw ?? {},
        },
        { onConflict: "provider,transaction_id" }
      )
      .select("id")
      .single();
    if (error) return { error: error.message };
    return { id: data.id };
  }

  const pool = getPgPool();
  if (pool) {
    const result = await pool.query<{ id: string }>(
      `insert into payments (lead_id, provider, transaction_id, status, amount_cents, currency, service_id, raw)
       values ($1,$2,$3,$4,$5,$6,$7,$8::jsonb)
       on conflict (provider, transaction_id) do update set
         status = excluded.status,
         amount_cents = coalesce(excluded.amount_cents, payments.amount_cents),
         raw = excluded.raw,
         updated_at = now()
       returning id`,
      [
        payment.lead_id ?? null,
        payment.provider,
        payment.transaction_id,
        payment.status,
        payment.amount_cents ?? null,
        payment.currency ?? null,
        payment.service_id ?? "technical_discovery",
        JSON.stringify(payment.raw ?? {}),
      ]
    );
    return { id: result.rows[0].id };
  }

  console.warn("[db] Payment upsert skipped — DB not configured", payment.transaction_id);
  return { id: crypto.randomUUID() };
}

export async function insertBooking(
  booking: BookingInsert
): Promise<{ id: string } | { error: string }> {
  const sb = getSupabaseAdmin();
  if (sb) {
    const { data, error } = await sb
      .from("bookings")
      .insert({
        lead_id: booking.lead_id,
        payment_id: booking.payment_id ?? null,
        token_hash: booking.token_hash,
        expires_at: booking.expires_at,
        calendar_url: booking.calendar_url ?? null,
        status: booking.status ?? "unlocked",
      })
      .select("id")
      .single();
    if (error) return { error: error.message };
    return { id: data.id };
  }

  const pool = getPgPool();
  if (pool) {
    const result = await pool.query<{ id: string }>(
      `insert into bookings (lead_id, payment_id, token_hash, expires_at, calendar_url, status)
       values ($1,$2,$3,$4,$5,$6) returning id`,
      [
        booking.lead_id,
        booking.payment_id ?? null,
        booking.token_hash,
        booking.expires_at,
        booking.calendar_url ?? null,
        booking.status ?? "unlocked",
      ]
    );
    return { id: result.rows[0].id };
  }

  console.warn("[db] Booking insert skipped — DB not configured");
  return { id: crypto.randomUUID() };
}

export async function getBookingByTokenHash(tokenHash: string) {
  const sb = getSupabaseAdmin();
  if (sb) {
    const { data, error } = await sb
      .from("bookings")
      .select("*")
      .eq("token_hash", tokenHash)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  }

  const pool = getPgPool();
  if (pool) {
    const result = await pool.query(`select * from bookings where token_hash = $1`, [
      tokenHash,
    ]);
    return result.rows[0] ?? null;
  }

  return null;
}

export async function markBookingUsed(id: string) {
  const sb = getSupabaseAdmin();
  if (sb) {
    await sb
      .from("bookings")
      .update({ status: "used", used_at: new Date().toISOString() })
      .eq("id", id);
    return;
  }
  const pool = getPgPool();
  if (pool) {
    await pool.query(
      `update bookings set status = 'used', used_at = now() where id = $1`,
      [id]
    );
  }
}

export async function trackEventServer(event: {
  name: string;
  lead_id?: string;
  session_id?: string;
  locale?: string;
  path?: string;
  properties?: Record<string, unknown>;
}) {
  const sb = getSupabaseAdmin();
  if (sb) {
    await sb.from("events").insert({
      name: event.name,
      lead_id: event.lead_id ?? null,
      session_id: event.session_id ?? null,
      locale: event.locale ?? null,
      path: event.path ?? null,
      properties: event.properties ?? {},
    });
    return;
  }
  const pool = getPgPool();
  if (pool) {
    await pool.query(
      `insert into events (name, lead_id, session_id, locale, path, properties)
       values ($1,$2,$3,$4,$5,$6::jsonb)`,
      [
        event.name,
        event.lead_id ?? null,
        event.session_id ?? null,
        event.locale ?? null,
        event.path ?? null,
        JSON.stringify(event.properties ?? {}),
      ]
    );
    return;
  }
  console.info("[analytics:server]", event.name, event.properties ?? {});
}
