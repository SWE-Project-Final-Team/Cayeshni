import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-md bg-background p-8 text-on-background">
      <h1 className="text-headline-md text-primary">Cayeshni</h1>
      <p className="text-body-md text-on-surface-variant">
        Split and settle group expenses.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-md">
        <Link
          href="/login"
          className="text-label-sm rounded-lg bg-secondary px-lg py-md text-on-secondary shadow-sm hover:bg-secondary/90"
        >
          Sign in
        </Link>
        <Link
          href="/dashboard"
          className="text-label-sm rounded-lg border border-outline-variant px-lg py-md text-primary hover:bg-surface-container-low"
        >
          Dashboard
        </Link>
      </div>
    </main>
  );
}
