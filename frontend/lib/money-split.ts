/** Split `total` into `count` parts in cents so the parts sum exactly to `total` (2 dp). */
export function equalParts(total: number, count: number): number[] {
  if (count <= 0 || !Number.isFinite(total)) return [];
  const cents = Math.round(total * 100);
  const base = Math.floor(cents / count);
  const rem = cents % count;
  return Array.from({ length: count }, (_, i) => (base + (i < rem ? 1 : 0)) / 100);
}

export function toCents(n: number): number {
  return Math.round(n * 100);
}
