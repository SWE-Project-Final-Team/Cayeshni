"use client";

import Link from "next/link";
import { useState } from "react";
import { forgotPassword } from "@/lib/api/auth.api";

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setPending(true);
    try {
      const responseMessage = await forgotPassword(email);
      setMessage(responseMessage);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to request reset link");
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-md text-on-background md:p-xl">
      <div className="w-full max-w-[720px] rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-xl shadow-level-1 md:p-12">
        <h1 className="text-headline-md text-primary mb-sm">Forgot password</h1>
        <p className="text-body-md text-on-surface-variant mb-lg">
          Enter your account email and we will send you a reset link.
        </p>

        <form onSubmit={handleSubmit} className="space-y-md" noValidate>
          {error ? (
            <p
              className="text-label-sm rounded-lg border border-error/40 bg-error-container/30 px-md py-sm text-error"
              role="alert"
            >
              {error}
            </p>
          ) : null}
          {message ? (
            <p
              className="text-label-sm rounded-lg border border-primary/30 bg-primary/10 px-md py-sm text-primary"
              role="status"
            >
              {message}
            </p>
          ) : null}

          <div>
            <label
              htmlFor="forgot-email"
              className="text-label-sm text-on-surface-variant mb-xs block"
            >
              Email Address
            </label>
            <input
              id="forgot-email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              className="input-field"
              value={email}
              onChange={(ev) => setEmail(ev.target.value)}
              disabled={pending}
              required
            />
          </div>

          <button
            type="submit"
            disabled={pending}
            className="text-label-sm flex w-full items-center justify-center gap-sm rounded-lg bg-secondary py-md text-on-secondary shadow-sm transition-all hover:bg-secondary/90 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending ? "Sending link..." : "Send reset link"}
          </button>
        </form>

        <div className="mt-lg text-center">
          <Link href="/login" className="text-label-sm text-secondary hover:underline">
            Back to sign in
          </Link>
        </div>
      </div>
    </main>
  );
}
