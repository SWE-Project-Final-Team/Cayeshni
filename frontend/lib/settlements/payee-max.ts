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

  await Promise.all(
    payees.map(async (p) => {
      if (p.userId === payerId) {
        out[p.userId] = 0;
        return;
      }
      const ids = candidateTransactionIds(txs, payerId, p.userId);
      if (ids.length === 0) {
        out[p.userId] = 0;
        return;
      }
      try {
        const details: TransactionDetailDto[] = await Promise.all(
          ids.map((id) => apiJson<TransactionDetailDto>(`/api/transactions/${id}`, { accessToken }))
        );
        out[p.userId] = maxSettleableTowardPayee(details, payerId);
      } catch (_) {
        out[p.userId] = 0;
      }
    })
  );

  return out;
}
