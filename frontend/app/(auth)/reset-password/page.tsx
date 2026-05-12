"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { apiJson } from "@/lib/api/client";
import { useAuth } from "@/lib/auth/auth-context";

export default function ResetPasswordPage() {
  const params = useSearchParams();
  const { apiErrorMessage } = useAuth();

  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    setEmail(params.get("email") ?? "");
    setToken(params.get("token") ?? "");
  }, [params]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setPending(true);
    try {
      await apiJson("/api/auth/reset-password", {
        method: "POST",
        json: { email, token, newPassword: password },
      });
      setDone(true);
    } catch (e) {
      setErr(apiErrorMessage(e));
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="w-full min-w-0 max-w-[1000px] mx-auto">
      <div className="w-full min-w-0 bg-surface-container-lowest rounded-2xl border border-outline-variant/30 shadow-level-2 p-lg md:p-xl">
      <h1 className="font-headline-md text-headline-md text-primary mb-sm">
        New password
      </h1>
      {done ? (
        <p className="font-body-md text-on-surface-variant mb-lg">
          Your password was updated.{" "}
          <Link href="/login" className="text-secondary font-semibold hover:underline">
            Sign in
          </Link>
        </p>
      ) : (
        <>
          <p className="font-body-md text-body-md text-on-surface-variant mb-lg">
            Choose a new password for your account.
          </p>
          {err && (
            <div className="mb-md rounded-lg bg-error-container/40 text-error px-md py-sm font-body-md">
              {err}
            </div>
          )}
          <form className="space-y-md" onSubmit={onSubmit}>
            <div>
              <label className="block font-label-sm text-label-sm text-on-surface-variant mb-xs">
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-md py-sm font-body-md text-on-surface focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20"
              />
            </div>
            <div>
              <label className="block font-label-sm text-label-sm text-on-surface-variant mb-xs">
                Token
              </label>
              <input
                type="text"
                required
                value={token}
                onChange={(e) => setToken(e.target.value)}
                className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-md py-sm font-body-md text-on-surface font-mono text-sm"
              />
            </div>
            <div>
              <label className="block font-label-sm text-label-sm text-on-surface-variant mb-xs">
                New password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-md py-sm font-body-md text-on-surface focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20"
              />
            </div>
            <button
              type="submit"
              disabled={pending}
              className="w-full bg-secondary text-on-secondary font-label-sm py-md rounded-lg hover:bg-secondary/90 disabled:opacity-60"
            >
              Update password
            </button>
          </form>
        </>
      )}
      <p className="mt-lg text-center font-label-sm text-on-surface-variant">
        <Link href="/login" className="text-secondary hover:underline">
          Back to sign in
        </Link>
      </p>
      </div>
    </div>
  );
}
