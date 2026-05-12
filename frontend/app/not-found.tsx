import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-[100dvh] w-full min-w-0 flex flex-col items-center justify-center bg-background py-xl text-on-background">
      <div className="w-full min-w-0 max-w-7xl mx-auto px-container-margin space-y-lg">
        <div className="text-center space-y-xs max-w-3xl mx-auto">
          <p className="font-financial-xl text-financial-xl text-primary tabular-nums">
            404
          </p>
          <h1 className="font-display-lg text-display-lg text-on-surface tracking-tight">
            This route has no budget line
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant">
            The server checked under the couch cushions. Still nothing.
          </p>
        </div>

        {/* Drake-style meme (original copy) */}
        <div
          className="w-full min-w-0 max-w-3xl mx-auto rounded-2xl border-2 border-outline-variant overflow-hidden bg-surface-container-lowest shadow-level-2"
          aria-label="Meme: Drake format about 404 pages"
        >
          <div className="flex items-stretch border-b border-outline-variant/60 min-w-0">
            <div className="w-14 shrink-0 bg-surface-container-high flex items-center justify-center font-display-lg text-display-lg text-on-surface-variant select-none">
              ✕
            </div>
            <div className="flex-1 min-w-0 px-md py-sm font-body-md text-on-surface-variant line-through decoration-error/60 break-words">
              Admitting you typed the URL wrong
            </div>
          </div>
          <div className="flex items-stretch bg-secondary-fixed/40 min-w-0">
            <div className="w-14 shrink-0 bg-secondary flex items-center justify-center">
              <span className="material-symbols-outlined text-on-secondary text-[28px] fill">
                thumb_up
              </span>
            </div>
            <div className="flex-1 min-w-0 px-md py-sm font-body-md text-on-surface font-medium break-words">
              Blaming inflation for a missing page (same energy)
            </div>
          </div>
        </div>

        {/* “Stonks” energy, original one-liner */}
        <div className="w-full min-w-0 max-w-3xl mx-auto rounded-xl border border-outline-variant bg-surface px-md py-md text-center space-y-sm">
          <p className="font-label-sm text-label-sm uppercase tracking-widest text-secondary">
            Not routes 📉
          </p>
          <p className="font-body-md text-on-surface italic">
            {`"We underwrote this URL. The risk model said no."`}
          </p>
          <p className="font-body-md text-on-surface-variant text-sm">
            {`- your browser's CFO (probably)`}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row flex-wrap gap-sm justify-center items-stretch sm:items-center pt-sm w-full min-w-0 max-w-3xl mx-auto">
          <Link
            href="/"
            className="inline-flex justify-center items-center gap-xs rounded-lg bg-secondary text-on-secondary font-label-sm py-sm px-lg hover:bg-secondary/90 transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">home</span>
            Home
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex justify-center items-center gap-xs rounded-lg border border-outline-variant bg-surface text-primary font-label-sm py-sm px-lg hover:bg-surface-container-high transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">account_balance_wallet</span>
            Dashboard
          </Link>
          <Link
            href="/login"
            className="inline-flex justify-center items-center gap-xs rounded-lg border border-transparent text-secondary font-label-sm py-sm px-lg hover:underline"
          >
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
