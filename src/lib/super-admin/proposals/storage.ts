import { createHash } from "node:crypto";
import { mkdir, writeFile, readFile, access } from "node:fs/promises";
import path from "node:path";
import { adminQuery } from "@/lib/db";

const PRIVATE_ROOT = path.join(process.cwd(), "private", "proposals");

function canUseLocalFs(): boolean {
  // Vercel/AWS Lambda filesystem is read-only except /tmp.
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    return false;
  }
  return process.env.PROPOSAL_PDF_FS !== "0";
}

export function proposalStorageKey(
  proposalId: string,
  version: number,
  numberDisplay: string
): string {
  const safe = numberDisplay.replace(/[^A-Za-z0-9._-]/g, "_");
  return `${proposalId}/v${version}-${safe}.pdf`;
}

async function tryWriteLocalFs(storageKey: string, bytes: Buffer): Promise<void> {
  if (!canUseLocalFs()) return;
  try {
    const absolute = path.join(PRIVATE_ROOT, storageKey);
    await mkdir(path.dirname(absolute), { recursive: true });
    await writeFile(absolute, bytes);
  } catch (error) {
    console.warn("[proposals/storage] local FS write skipped", error);
  }
}

export async function storeProposalPdf(opts: {
  proposalId: string;
  version: number;
  numberDisplay: string;
  bytes: Buffer;
  actorUserId: string;
}): Promise<{ documentId: string; storageKey: string; checksum: string }> {
  const storageKey = proposalStorageKey(
    opts.proposalId,
    opts.version,
    opts.numberDisplay
  );

  // Durable source of truth on serverless is Postgres bytea.
  await tryWriteLocalFs(storageKey, opts.bytes);

  const checksum = createHash("sha256").update(opts.bytes).digest("hex");

  const result = await adminQuery<{ id: string }>(
    `insert into proposal_documents (
       proposal_id, version, storage_key, content_type, byte_size, checksum_sha256,
       created_by, pdf_bytes
     ) values ($1,$2,$3,'application/pdf',$4,$5,$6,$7)
     returning id`,
    [
      opts.proposalId,
      opts.version,
      storageKey,
      opts.bytes.length,
      checksum,
      opts.actorUserId,
      opts.bytes,
    ]
  );

  return {
    documentId: result.rows[0].id,
    storageKey,
    checksum,
  };
}

export async function loadProposalPdf(opts: {
  proposalId: string;
  version?: number;
}): Promise<{
  bytes: Buffer;
  contentType: string;
  storageKey: string;
  version: number;
} | null> {
  const result = await adminQuery<{
    id: string;
    version: number;
    storage_key: string;
    content_type: string;
    pdf_bytes: Buffer | null;
  }>(
    opts.version
      ? `select id, version, storage_key, content_type, pdf_bytes
         from proposal_documents
         where proposal_id = $1 and version = $2
         order by created_at desc limit 1`
      : `select id, version, storage_key, content_type, pdf_bytes
         from proposal_documents
         where proposal_id = $1
         order by version desc, created_at desc limit 1`,
    opts.version ? [opts.proposalId, opts.version] : [opts.proposalId]
  );
  const row = result.rows[0];
  if (!row) return null;

  if (row.pdf_bytes && Buffer.isBuffer(row.pdf_bytes) && row.pdf_bytes.length) {
    return {
      bytes: row.pdf_bytes,
      contentType: row.content_type,
      storageKey: row.storage_key,
      version: row.version,
    };
  }

  // pg may return bytea as Uint8Array depending on type parsers
  if (row.pdf_bytes && (row.pdf_bytes as unknown as Uint8Array).byteLength) {
    return {
      bytes: Buffer.from(row.pdf_bytes as unknown as Uint8Array),
      contentType: row.content_type,
      storageKey: row.storage_key,
      version: row.version,
    };
  }

  if (!canUseLocalFs()) return null;

  const absolute = path.join(PRIVATE_ROOT, row.storage_key);
  try {
    await access(absolute);
    const bytes = await readFile(absolute);
    return {
      bytes,
      contentType: row.content_type,
      storageKey: row.storage_key,
      version: row.version,
    };
  } catch {
    return null;
  }
}
