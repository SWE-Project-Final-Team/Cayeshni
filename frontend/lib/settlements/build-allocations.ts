import type { TransactionDetailDto, TransactionDto } from "@/lib/api/types";

export type SettlementAllocationInput = {
  transactionId: string;
  debtorUserId: string;
  allocatedAmount: number;
};

function toCents(n: number): number {
  return Math.round((n + Number.EPSILON) * 100);
}

function fromCents(c: number): number {
  return Math.round(c) / 100;
}

/** Expenses paid by `payeeId` where `payerId` still owes a split (before per-tx remaining fetch). */
export function candidateTransactionIds(
  txs: TransactionDto[],
  payerId: string,
  payeeId: string
): string[] {
  return txs
    .filter(
      (t) =>
        t.paidByUserId === payeeId &&
        t.members.some((m) => m.userId === payerId && (m.amountOwed ?? 0) > 0)
    )
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    .map((t) => t.id);
}

export function maxSettleableTowardPayee(
  details: TransactionDetailDto[],
  payerId: string
): number {
  let cents = 0;
  for (const tx of details) {
    const row = tx.members.find((m) => m.userId === payerId);
    cents += toCents(row?.remainingOwed ?? 0);
  }
  return fromCents(cents);
}

/**
 * Oldest expenses first: applies `amount` against payer's remaining owed on each detail row.
 */
export function buildAllocationsFifo(
  details: TransactionDetailDto[],
  payerId: string,
  amount: number
): SettlementAllocationInput[] {
  let leftCents = toCents(amount);
  const out: SettlementAllocationInput[] = [];
  const ordered = [...details].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
  for (const tx of ordered) {
    if (leftCents <= 0) break;
    const row = tx.members.find((m) => m.userId === payerId);
    const remCents = toCents(row?.remainingOwed ?? 0);
    if (remCents <= 0) continue;
    const takeCents = Math.min(remCents, leftCents);
    if (takeCents > 0) {
      out.push({
        transactionId: tx.id,
        debtorUserId: payerId,
        allocatedAmount: fromCents(takeCents),
      });
      leftCents -= takeCents;
    }
  }
  return out;
}
