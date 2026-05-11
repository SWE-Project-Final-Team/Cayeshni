"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { resetPassword } from "@/lib/api/auth.api";

export function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const emailFromQuery = searchParams.get("email") ?? "";
  const tokenFromQuery = searchParams.get("token") ?? "";
  const [email, setEmail] = useState(emailFromQuery);
  const [token, setToken] = useState(tokenFromQuery);
  const [newPassword, setNewPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const missingRequired = useMemo(() => !email.trim() || !token.trim(), [email, token]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      await resetPassword({
        email: email.trim(),
        token: token.trim(),
        newPassword,
      });
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Password reset failed");
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-md text-on-background md:p-xl">
      <div className="w-full max-w-[720px] rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-xl shadow-level-1 md:p-12">
        <h1 className="text-headline-md text-primary mb-sm">Reset password</h1>
        <p className="text-body-md text-on-surface-variant mb-lg">
          Enter the reset details and set a new password for your account.
        </p>

        {done ? (
          <div className="space-y-md">
            <p
              className="text-label-sm rounded-lg border border-primary/30 bg-primary/10 px-md py-sm text-primary"
              role="status"
            >
              Your password has been reset successfully.
            </p>
            <Link
              href="/login"
              className="text-label-sm inline-flex items-center justify-center rounded-lg bg-secondary px-lg py-md text-on-secondary"
            >
              Go to sign in
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-md" noValidate>
            {error ? (
              <p
                className="text-label-sm rounded-lg border border-error/40 bg-error-container/30 px-md py-sm text-error"
                role="alert"
              >
                {error}
              </p>
            ) : null}

            <div>
              <label
                htmlFor="reset-email"
                className="text-label-sm text-on-surface-variant mb-xs block"
              >
                Email Address
              </label>
              <input
                id="reset-email"
                name="email"
                type="email"
                autoComplete="email"
                className="input-field"
                value={email}
                onChange={(ev) => setEmail(ev.target.value)}
                disabled={pending}
                required
              />
            </div>

            <div>
              <label
                htmlFor="reset-token"
                className="text-label-sm text-on-surface-variant mb-xs block"
              >
                Reset token
              </label>
              <input
                id="reset-token"
                name="token"
                type="text"
                className="input-field"
                value={token}
                onChange={(ev) => setToken(ev.target.value)}
                disabled={pending}
                required
              />
            </div>

            <div>
              <label
                htmlFor="reset-new-password"
                className="text-label-sm text-on-surface-variant mb-xs block"
              >
                New password
              </label>
              <input
                id="reset-new-password"
                name="newPassword"
                type="password"
                autoComplete="new-password"
                placeholder="Create a strong password"
                className="input-field"
                value={newPassword}
                onChange={(ev) => setNewPassword(ev.target.value)}
                disabled={pending}
                required
                minLength={1}
              />
            </div>

            {missingRequired ? (
              <p className="text-label-sm text-on-surface-variant">
                The reset link should include both email and token. You can paste them
                manually if needed.
              </p>
            ) : null}

            <button
              type="submit"
              disabled={pending}
              className="text-label-sm flex w-full items-center justify-center gap-sm rounded-lg bg-secondary py-md text-on-secondary shadow-sm transition-all hover:bg-secondary/90 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
            >
              {pending ? "Resetting..." : "Reset password"}
            </button>
          </form>
        )}

        <div className="mt-lg text-center">
          <Link href="/login" className="text-label-sm text-secondary hover:underline">
            Back to sign in
          </Link>
        </div>
      </div>
    </main>
  );
}
