export const CURRENCY_OPTIONS: { value: number; label: string }[] = [
  { value: 0, label: "USD ($)" },
  { value: 1, label: "EUR (€)" },
  { value: 2, label: "GBP (£)" },
  { value: 3, label: "EGP" },
  { value: 4, label: "AED" },
  { value: 5, label: "SAR" },
  { value: 6, label: "JPY" },
  { value: 7, label: "CAD" },
  { value: 8, label: "AUD" },
  { value: 9, label: "CHF" },
  { value: 10, label: "CNY" },
];

export function currencyCode(value: number): string {
  const row = CURRENCY_OPTIONS.find((c) => c.value === value);
  return row?.label.split(" ")[0] ?? String(value);
}

/** Backend serializes `Currency` as string with JsonStringEnumConverter. */
const currencyNameToValue: Record<string, number> = {
  USD: 0,
  EUR: 1,
  GBP: 2,
  EGP: 3,
  AED: 4,
  SAR: 5,
  JPY: 6,
  CAD: 7,
  AUD: 8,
  CHF: 9,
  CNY: 10,
};

export function currencyValueFromApi(v: string | number | undefined | null): number {
  if (v == null) return 0;
  if (typeof v === "number" && !Number.isNaN(v)) return v;
  if (typeof v === "string") {
    const byName = currencyNameToValue[v.toUpperCase()];
    if (byName !== undefined) return byName;
    const n = Number(v);
    if (!Number.isNaN(n)) return n;
  }
  return 0;
}

/** Serialize `Currency` enum for JSON body (matches backend JsonStringEnumConverter). */
export function currencyApiName(value: number): string {
  const entry = Object.entries(currencyNameToValue).find(([, v]) => v === value);
  return entry?.[0] ?? "USD";
}
