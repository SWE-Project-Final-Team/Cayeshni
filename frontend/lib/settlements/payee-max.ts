import { apiJson } from "@/lib/api/client";
import type { TransactionDetailDto, TransactionDto } from "@/lib/api/types";
import { candidateTransactionIds, maxSettleableTowardPayee } from "./build-allocations";

/**
 * For a given payer (current user) and the group's transactions, compute a map
 * of payeeUserId -> max amount the payer can settle toward that payee.
 *
 * This centralizes the logic used by the Settlements UI so it's easier to
 * reason about and test.
 */
export async function computePayeeMaxByUserId(
  accessToken: string,
  payerId: string,
  txs: TransactionDto[],
  payees: { userId: string }[]
): Promise<Record<string, number>> {
  const out: Record<string, number> = {};
  // Early exit
  if (!accessToken || !payerId) {
    for (const p of payees) out[p.userId] = 0;
    return out;
  }
  // Collect candidate transaction ids for all payees, then fetch details once.
  const payeeToIds = new Map<string, string[]>();
  const allIds = new Set<string>();
  for (const p of payees) {
    if (p.userId === payerId) {
      payeeToIds.set(p.userId, []);
      out[p.userId] = 0;
      continue;
    }
    const ids = candidateTransactionIds(txs, payerId, p.userId);
    payeeToIds.set(p.userId, ids);
    for (const id of ids) allIds.add(id);
  }

  if (allIds.size === 0) {
    // Nothing to fetch — return zeros for payees we haven't set yet.
    for (const p of payees) if (!(p.userId in out)) out[p.userId] = 0;
    return out;
  }

  // Fetch all transaction details in parallel (single flight)
  let details: TransactionDetailDto[];
  try {
    details = await Promise.all(
      Array.from(allIds).map((id) => apiJson<TransactionDetailDto>(`/api/transactions/${id}`, { accessToken }))
    );
  } catch (_) {
    // On failure, return zeros for remaining payees
    for (const p of payees) if (!(p.userId in out)) out[p.userId] = 0;
    return out;
  }

  const detailsById = new Map(details.map((d) => [d.id, d] as const));

  for (const p of payees) {
    if (p.userId === payerId) {
      out[p.userId] = 0;
      continue;
    }
    const ids = payeeToIds.get(p.userId) ?? [];
    if (ids.length === 0) {
      out[p.userId] = 0;
      continue;
    }
    const dets = ids.map((id) => detailsById.get(id)).filter((x): x is TransactionDetailDto => Boolean(x));
    out[p.userId] = maxSettleableTowardPayee(dets, payerId);
  }

  return out;
}
