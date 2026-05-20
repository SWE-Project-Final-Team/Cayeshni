"use client";

import Link from "next/link";
import { useState } from "react";
import { apiJson } from "@/lib/api/client";
import { useAuth } from "@/lib/auth/auth-context";
import { useI18n } from "@/lib/i18n";

export default function ForgotPasswordPage() {
  const { apiErrorMessage } = useAuth();
  const { t } = useI18n();
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setMsg(null);
    setPending(true);
    try {
      const res = await apiJson<{ message?: string }>(
        "/api/auth/forgot-password",
        {
          method: "POST",
          json: { email },
        }
      );
      setMsg(
        res?.message ?? t("If that email exists, a reset link has been sent.")
      );
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
        {t("Reset password")}
      </h1>
      <p className="font-body-md text-body-md text-on-surface-variant mb-lg">
        {t("Enter your email and we&apos;ll send a link when the account exists.")}
      </p>
      {err && (
        <div className="mb-md rounded-lg bg-error-container/40 text-error px-md py-sm font-body-md">
          {err}
        </div>
      )}
      {msg && (
        <div className="mb-md rounded-lg bg-secondary-fixed/50 text-primary px-md py-sm font-body-md">
          {msg}
        </div>
      )}
      <form className="space-y-md" onSubmit={onSubmit}>
        <div>
          <label className="block font-label-sm text-label-sm text-on-surface-variant mb-xs">
            {t("Email")}
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-md py-sm font-body-md text-on-surface focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20"
          />
        </div>
        <button
          type="submit"
          disabled={pending}
          className="w-full bg-secondary text-on-secondary font-label-sm py-md rounded-lg hover:bg-secondary/90 disabled:opacity-60"
        >
          {t("Send reset link")}
        </button>
      </form>
      <p className="mt-lg text-center font-label-sm text-on-surface-variant">
        <Link href="/login" className="text-secondary hover:underline">
          {t("Back to sign in")}
        </Link>
      </p>
      </div>
    </div>
  );
}
