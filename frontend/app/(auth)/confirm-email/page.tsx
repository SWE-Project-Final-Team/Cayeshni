"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import { apiJson } from "@/lib/api/client";
import { consumePostAuthRedirect } from "@/lib/auth/post-auth-redirect";
import { useAuth } from "@/lib/auth/auth-context";

export default function ConfirmEmailPage() {
  const params = useSearchParams();
  const { apiErrorMessage, refreshSession } = useAuth();

  const [userId, setUserId] = useState("");
  const [token, setToken] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [pending, setPending] = useState(false);
  const [continueHref, setContinueHref] = useState("/dashboard");

  useEffect(() => {
    setUserId(params.get("userId") ?? "");
    setToken(params.get("token") ?? "");
  }, [params]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setPending(true);
    try {
      await apiJson("/api/auth/confirm-email", {
        method: "POST",
        json: { userId, token },
      });
      await refreshSession();
      setContinueHref(consumePostAuthRedirect() ?? "/dashboard");
      setDone(true);
    } catch (e) {
      setErr(apiErrorMessage(e));
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="w-full max-w-md bg-surface-container-lowest rounded-2xl border border-outline-variant/30 shadow-level-2 p-lg md:p-xl">
      <h1 className="font-headline-md text-headline-md text-primary mb-sm">
        Confirm email
      </h1>
      {done ? (
        <p className="font-body-md text-on-surface-variant">
          Thanks — your email is confirmed.{" "}
          <Link href={continueHref} className="text-secondary font-semibold hover:underline">
            Continue
          </Link>
        </p>
      ) : (
        <>
          <p className="font-body-md text-body-md text-on-surface-variant mb-lg">
            Confirm the address for your Cayeshni account.
          </p>
          {err && (
            <div className="mb-md rounded-lg bg-error-container/40 text-error px-md py-sm font-body-md">
              {err}
            </div>
          )}
          <form className="space-y-md" onSubmit={onSubmit}>
            <div>
              <label className="block font-label-sm text-label-sm text-on-surface-variant mb-xs">
                User ID
              </label>
              <input
                type="text"
                required
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-md py-sm font-body-md text-on-surface font-mono text-sm"
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
                className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-md py-sm font-body-md text-on-surface font-mono text-sm break-all"
              />
            </div>
            <button
              type="submit"
              disabled={pending || !userId || !token}
              className="w-full bg-secondary text-on-secondary font-label-sm py-md rounded-lg hover:bg-secondary/90 disabled:opacity-60"
            >
              Confirm
            </button>
          </form>
        </>
      )}
      <p className="mt-lg text-center font-label-sm text-on-surface-variant">
        <Link href="/login" className="text-secondary hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
