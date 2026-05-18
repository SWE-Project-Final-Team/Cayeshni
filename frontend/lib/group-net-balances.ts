import type { SettlementDto, TransactionDto } from "@/lib/api/types";

/**
 * Net balance per member after all transactions and settlements (same rules as
 * `DashboardService` for one group): positive = member is owed money overall,
 * negative = member owes money overall.
 */
export function computeMemberNetBalances(
  memberIds: readonly string[],
  transactions: readonly TransactionDto[],
  settlements: readonly SettlementDto[]
): Map<string, number> {
  const balance = new Map<string, number>();
  for (const id of memberIds) balance.set(id, 0);

  for (const tx of transactions) {
    if (balance.has(tx.paidByUserId)) {
      balance.set(
        tx.paidByUserId,
        (balance.get(tx.paidByUserId) ?? 0) + tx.totalAmount
      );
    }
    for (const m of tx.members) {
      if (balance.has(m.userId)) {
        balance.set(m.userId, (balance.get(m.userId) ?? 0) - m.amountOwed);
      }
    }
  }

  for (const s of settlements) {
    if (balance.has(s.payerUserId)) {
      balance.set(s.payerUserId, (balance.get(s.payerUserId) ?? 0) + s.amount);
    }
    if (balance.has(s.payeeUserId)) {
      balance.set(s.payeeUserId, (balance.get(s.payeeUserId) ?? 0) - s.amount);
    }
  }

  return balance;
}

export type TransferEdge = { from: string; to: string; amount: number };

const EPS = 0.005;

function roundMoney(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Greedy simplification: minimal set of debtor → creditor transfers that
 * clears all non-zero net balances (standard split-the-bill approximation).
 */
export function simplifyToTransferEdges(netByMember: Map<string, number>): TransferEdge[] {
  const edges: TransferEdge[] = [];
  const m = new Map(netByMember);

  while (true) {
    let debtorId: string | null = null;
    let debtorBal = 0;
    for (const [id, v] of m) {
      if (v < -EPS && (!debtorId || v < debtorBal)) {
        debtorId = id;
        debtorBal = v;
      }
    }
    let creditorId: string | null = null;
    let creditorBal = 0;
    for (const [id, v] of m) {
      if (v > EPS && (!creditorId || v > creditorBal)) {
        creditorId = id;
        creditorBal = v;
      }
    }
    if (!debtorId || !creditorId) break;

    const pay = roundMoney(Math.min(-debtorBal, creditorBal));
    if (pay <= EPS) break;

    edges.push({ from: debtorId, to: creditorId, amount: pay });
    m.set(debtorId, roundMoney(debtorBal + pay));
    m.set(creditorId, roundMoney(creditorBal - pay));
  }

  return edges;
}
