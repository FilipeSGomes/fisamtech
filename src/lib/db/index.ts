import { setDefaultResultOrder } from "node:dns";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import pg from "pg";

// Prefer IPv4 — Supabase direct/pooler backends are often IPv6-first and
// unreachable from some build/serverless networks.
try {
  setDefaultResultOrder("ipv4first");
} catch {
  // older Node without the API
}

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
  // Supabase direct db.* hosts are often IPv6-only; Vercel needs the
  // pooler (IPv4) URL. Strip sslmode so pg does not force verify-full
  // against Supabase's chain on serverless.
  const isLocal = url.includes("localhost") || url.includes("127.0.0.1");
  let connectionString = url;
  if (!isLocal) {
    try {
      const parsed = new URL(url);
      parsed.searchParams.delete("sslmode");
      connectionString = parsed.toString();
    } catch {
      connectionString = url;
    }
  }
  pgPool = new pg.Pool({
    connectionString,
    max: 3,
    ssl: isLocal ? undefined : { rejectUnauthorized: false },
  });
  return pgPool;
}

/** Direct Postgres access for Super Admin services (requires DATABASE_URL). */
export async function adminQuery<T extends pg.QueryResultRow = pg.QueryResultRow>(
  text: string,
  params: unknown[] = []
): Promise<pg.QueryResult<T>> {
  const pool = getPgPool();
  if (!pool) throw new Error("DATABASE_URL not configured");
  return pool.query<T>(text, params);
}

export async function withAdminTransaction<T>(
  fn: (client: pg.PoolClient) => Promise<T>
): Promise<T> {
  const pool = getPgPool();
  if (!pool) throw new Error("DATABASE_URL not configured");
  const client = await pool.connect();
  try {
    await client.query("begin");
    const result = await fn(client);
    await client.query("commit");
    return result;
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}

export async function insertLead(
  lead: LeadInsert
): Promise<{ id: string } | { error: string; degraded: true }> {
  const emailNormalized = lead.email.trim().toLowerCase();
  const phoneNormalized = lead.phone
    ? lead.phone.replace(/\D/g, "") || null
    : null;

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
        status: "NEW",
        email_normalized: emailNormalized,
        phone_normalized: phoneNormalized,
      })
      .select("id")
      .single();
    if (error) return { error: error.message, degraded: true };
    return { id: data.id };
  }

  const pool = getPgPool();
  if (pool) {
    const result = await pool.query<{ id: string }>(
      `insert into leads (
         name, email, company, country, locale, currency, role, challenge,
         budget_range, source, phone, metadata, status, email_normalized, phone_normalized
       )
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12::jsonb,'NEW',$13,$14)
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
        emailNormalized,
        phoneNormalized,
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

export async function getApprovedPaymentForLead(
  leadId: string
): Promise<{ id: string } | null> {
  const sb = getSupabaseAdmin();
  if (sb) {
    const { data, error } = await sb
      .from("payments")
      .select("id")
      .eq("lead_id", leadId)
      .eq("status", "approved")
      .limit(1)
      .maybeSingle();
    if (error || !data?.id) return null;
    return { id: data.id as string };
  }

  const pool = getPgPool();
  if (pool) {
    const result = await pool.query<{ id: string }>(
      `select id from payments where lead_id = $1 and status = 'approved' limit 1`,
      [leadId]
    );
    return result.rows[0] ?? null;
  }

  return null;
}

export async function getLeadContact(
  id: string
): Promise<{ email: string | null; locale: string | null } | null> {
  const sb = getSupabaseAdmin();
  if (sb) {
    const { data, error } = await sb
      .from("leads")
      .select("email, locale")
      .eq("id", id)
      .maybeSingle();
    if (error || !data) return null;
    return {
      email: (data.email as string | null) ?? null,
      locale: (data.locale as string | null) ?? null,
    };
  }

  const pool = getPgPool();
  if (pool) {
    const result = await pool.query<{ email: string | null; locale: string | null }>(
      `select email, locale from leads where id = $1`,
      [id]
    );
    return result.rows[0] ?? null;
  }

  return null;
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

export type WhistleblowingInsert = {
  category: string;
  description: string;
  approximate_date?: string | null;
  relation: string;
  anonymous: boolean;
  reporter_name?: string | null;
  reporter_email?: string | null;
  reporter_phone?: string | null;
  locale: string;
  consent?: boolean;
  metadata?: Record<string, unknown>;
};

function makeWhistleblowingProtocol(): string {
  const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const suffix = crypto.randomUUID().replace(/-/g, "").slice(0, 8).toUpperCase();
  return `FT-WB-${stamp}-${suffix}`;
}

export async function insertWhistleblowingReport(
  report: WhistleblowingInsert
): Promise<
  | { id: string; protocol: string }
  | { id: string; protocol: string; error: string; degraded: true }
> {
  const protocol = makeWhistleblowingProtocol();
  const row = {
    protocol,
    category: report.category,
    description: report.description,
    approximate_date: report.approximate_date ?? null,
    relation: report.relation,
    anonymous: report.anonymous,
    reporter_name: report.anonymous ? null : report.reporter_name ?? null,
    reporter_email: report.anonymous ? null : report.reporter_email ?? null,
    reporter_phone: report.anonymous ? null : report.reporter_phone ?? null,
    locale: report.locale,
    metadata: {
      ...(report.metadata ?? {}),
      consent: Boolean(report.consent),
    },
  };

  const sb = getSupabaseAdmin();
  if (sb) {
    const { data, error } = await sb
      .from("whistleblowing_reports")
      .insert(row)
      .select("id, protocol")
      .single();
    if (error) {
      console.warn("[db] whistleblowing insert failed — degraded", error.message);
      return {
        id: crypto.randomUUID(),
        protocol,
        error: error.message,
        degraded: true,
      };
    }
    return { id: data.id, protocol: data.protocol };
  }

  const pool = getPgPool();
  if (pool) {
    const result = await pool.query<{ id: string; protocol: string }>(
      `insert into whistleblowing_reports
        (protocol, category, description, approximate_date, relation, anonymous,
         reporter_name, reporter_email, reporter_phone, locale, metadata)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11::jsonb)
       returning id, protocol`,
      [
        row.protocol,
        row.category,
        row.description,
        row.approximate_date,
        row.relation,
        row.anonymous,
        row.reporter_name,
        row.reporter_email,
        row.reporter_phone,
        row.locale,
        JSON.stringify(row.metadata),
      ]
    );
    return { id: result.rows[0].id, protocol: result.rows[0].protocol };
  }

  // Graceful degrade: ephemeral protocol for local testing without DB
  const id = crypto.randomUUID();
  console.warn(
    "[db] DATABASE_URL / Supabase not configured — whistleblowing stored ephemerally:",
    protocol,
    { category: report.category, relation: report.relation, anonymous: report.anonymous }
  );
  return {
    id,
    protocol,
    error: "Database not configured",
    degraded: true,
  };
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
