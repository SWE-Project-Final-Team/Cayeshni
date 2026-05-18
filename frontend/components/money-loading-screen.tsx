"use client";

type MoneyLoadingScreenProps = {
  /** Shown under the Cayeshni title */
  message?: string;
  /** Full viewport (session bootstrap) vs smaller block (Suspense fallback) */
  variant?: "fullscreen" | "compact";
};

const DECOR_ICONS = ["payments", "account_balance_wallet", "savings"] as const;

export function MoneyLoadingScreen({
  message = "Counting the coins…",
  variant = "fullscreen",
}: MoneyLoadingScreenProps) {
  const isFull = variant === "fullscreen";

  return (
    <div
      className={
        isFull
          ? "min-h-screen w-full flex flex-col items-center justify-center bg-background relative overflow-hidden px-lg"
          : "w-full max-w-[min(100vw-1.5rem,72rem)] mx-auto flex flex-col items-center justify-center py-xl px-lg md:px-xl relative overflow-hidden rounded-2xl border border-outline-variant/40 bg-surface-container-lowest/80"
      }
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div
        className="absolute inset-0 pointer-events-none bg-gradient-to-br from-secondary-fixed/35 via-background to-primary-fixed/25"
        aria-hidden
      />
      <div
        className="absolute -top-20 -left-20 w-[280px] h-[280px] rounded-full bg-secondary/10 blur-3xl motion-safe:animate-[money-float_6s_ease-in-out_infinite]"
        aria-hidden
      />
      <div
        className="absolute -bottom-24 -right-16 w-[320px] h-[320px] rounded-full bg-primary/8 blur-3xl motion-safe:animate-[money-float_7s_ease-in-out_infinite_reverse]"
        aria-hidden
      />

      <div className="relative z-10 flex flex-col items-center gap-lg text-center w-full max-w-[min(100%,48rem)] px-sm">
        <div className="relative w-[5.5rem] h-[5.5rem] flex items-center justify-center">
          <div
            className="absolute inset-0 rounded-full border-[3px] border-outline-variant/50 border-t-secondary border-r-secondary/40 motion-safe:animate-spin"
            style={{ animationDuration: "1.35s" }}
            aria-hidden
          />
          <div
            className="absolute inset-2 rounded-full border-2 border-dashed border-secondary/25 motion-safe:animate-spin"
            style={{ animationDuration: "2.4s", animationDirection: "reverse" }}
            aria-hidden
          />
          <span className="material-symbols-outlined fill text-[2.75rem] text-secondary money-loading-pulse relative z-[1]">
            payments
          </span>
        </div>

        <div>
          <p className="font-display-lg text-display-lg text-primary tracking-tight">
            Cayeshni
          </p>
          <p className="font-body-md text-body-md text-on-surface-variant mt-xs">
            {message}
          </p>
        </div>

        <div className="flex items-center justify-center gap-sm" aria-hidden>
          {DECOR_ICONS.map((name, i) => (
            <span
              key={name}
              className="material-symbols-outlined text-[1.125rem] text-secondary/55 money-loading-stagger"
              style={{ animationDelay: `${i * 0.18}s` }}
            >
              {name}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
