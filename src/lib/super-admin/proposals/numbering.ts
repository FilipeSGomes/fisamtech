import type pg from "pg";

/**
 * Allocates FISAM-YYYY-NNNN sequentially inside a transaction.
 * Caller must run inside withAdminTransaction.
 */
export async function allocateProposalNumber(
  client: pg.PoolClient,
  year = new Date().getUTCFullYear()
): Promise<{ year: number; seq: number; display: string }> {
  await client.query(
    `insert into proposal_number_counters (year, last_value)
     values ($1, 0)
     on conflict (year) do nothing`,
    [year]
  );
  const result = await client.query<{ last_value: number }>(
    `update proposal_number_counters
     set last_value = last_value + 1
     where year = $1
     returning last_value`,
    [year]
  );
  const seq = result.rows[0].last_value;
  const display = `FISAM-${year}-${String(seq).padStart(4, "0")}`;
  return { year, seq, display };
}
