#!/usr/bin/env node
/**
 * Creates the first SUPER_ADMIN when admin_users is empty.
 *
 * Required env (from .env.local or process env):
 *   DATABASE_URL
 *   ADMIN_SESSION_SECRET (>=16 chars; used later for MFA)
 *   ADMIN_BOOTSTRAP_EMAIL
 *   ADMIN_BOOTSTRAP_NAME
 *   ADMIN_BOOTSTRAP_PASSWORD (>=12 chars)
 */
import fs from "node:fs";
import path from "node:path";
import { setDefaultResultOrder } from "node:dns";
import { randomBytes, scryptSync } from "node:crypto";
import pg from "pg";

try {
  setDefaultResultOrder("ipv4first");
} catch {
  // ignore on older Node
}

function loadEnvLocal() {
  const file = path.resolve(process.cwd(), ".env.local");
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, "utf8").split("\n")) {
    if (!line || line.trim().startsWith("#") || !line.includes("=")) continue;
    const i = line.indexOf("=");
    const k = line.slice(0, i);
    const v = line.slice(i + 1).trim().replace(/^["']|["']$/g, "");
    if (!(k in process.env)) process.env[k] = v;
  }
}

function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `scrypt$${salt}$${hash}`;
}

loadEnvLocal();

const email = process.env.ADMIN_BOOTSTRAP_EMAIL;
const name = process.env.ADMIN_BOOTSTRAP_NAME || "FISAM Super Admin";
const password = process.env.ADMIN_BOOTSTRAP_PASSWORD;
const databaseUrl = process.env.DATABASE_URL;
const sessionSecret = process.env.ADMIN_SESSION_SECRET;

if (!databaseUrl) {
  console.error("DATABASE_URL missing");
  process.exit(1);
}
if (!sessionSecret || sessionSecret.length < 16) {
  console.error("ADMIN_SESSION_SECRET missing or too short (min 16)");
  process.exit(1);
}
if (!email || !password || password.length < 12) {
  console.error(
    "Set ADMIN_BOOTSTRAP_EMAIL and ADMIN_BOOTSTRAP_PASSWORD (>=12 chars)"
  );
  process.exit(1);
}

const url = new URL(databaseUrl);
url.searchParams.delete("sslmode");
const client = new pg.Client({
  connectionString: url.toString(),
  ssl: { rejectUnauthorized: false },
});

await client.connect();
try {
  const count = await client.query(`select count(*)::int as n from admin_users`);
  if (count.rows[0].n > 0) {
    console.error("Bootstrap denied: admin users already exist");
    process.exit(2);
  }
  const emailNormalized = email.trim().toLowerCase();
  const passwordHash = hashPassword(password);
  const inserted = await client.query(
    `insert into admin_users (email, email_normalized, name, password_hash, status)
     values ($1,$2,$3,$4,'active') returning id`,
    [email.trim(), emailNormalized, name.trim(), passwordHash]
  );
  const userId = inserted.rows[0].id;
  await client.query(
    `insert into admin_user_roles (user_id, role_id)
     select $1, id from admin_roles where code = 'SUPER_ADMIN'`,
    [userId]
  );
  await client.query(
    `insert into admin_audit_logs (actor_user_id, action, resource_type, resource_id, context)
     values ($1::uuid,'USER_INVITED','admin_user',$2,$3::jsonb)`,
    [userId, userId, JSON.stringify({ bootstrap: true, email: emailNormalized })]
  );
  console.log("SUPER_ADMIN created:", userId, emailNormalized);
  console.log("Next: login at /pt-br/super-admin/login and enroll MFA.");
} finally {
  await client.end();
}
