/** Treat tiny float noise as zero for UI coloring. */
function isPositiveAmount(n: number): boolean {
  return Number.isFinite(n) && n > 1e-9;
}

/** Red “owe” styling only when there is a positive obligation. */
export function oweAmountClass(amount: number): string {
  return isPositiveAmount(amount)
    ? "text-balance-owe"
    : "text-on-surface font-medium";
}

/** Green “owed / settled” styling only when there is a positive amount. */
export function owedAmountClass(amount: number): string {
  return isPositiveAmount(amount)
    ? "text-balance-owed"
    : "text-on-surface font-medium";
}
