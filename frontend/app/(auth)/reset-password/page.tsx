"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { apiJson } from "@/lib/api/client";
import { useAuth } from "@/lib/auth/auth-context";
import { useI18n } from "@/lib/i18n";

export default function ResetPasswordPage() {
  const params = useSearchParams();
  const { apiErrorMessage } = useAuth();
  const { t } = useI18n();

  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [pending, setPending] = useState(false);
  const hasRequiredParams = Boolean(email && token);

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
          {t("New password")}
        </h1>
        {done ? (
          <p className="font-body-md text-on-surface-variant mb-lg">
            {t("Your password was updated.")}{" "}
            <Link
              href="/login"
              className="text-secondary font-semibold hover:underline"
            >
              {t("Sign in")}
            </Link>
          </p>
        ) : (
          <>
            <p className="font-body-md text-body-md text-on-surface-variant mb-lg">
              {t("Choose a new password for your account.")}
            </p>
            {!hasRequiredParams && (
              <div className="mb-md rounded-lg bg-error-container/40 text-error px-md py-sm font-body-md">
                {t(
                  "Invalid or incomplete reset link. Please request a new one.",
                )}
              </div>
            )}
            {err && (
              <div className="mb-md rounded-lg bg-error-container/40 text-error px-md py-sm font-body-md">
                {err}
              </div>
            )}
            <form className="space-y-md" onSubmit={onSubmit}>
              <div className="rounded-lg border border-outline-variant/30 bg-surface-container-low px-md py-sm">
                <p className="font-label-sm text-label-sm text-on-surface-variant">
                  {t("Account")}
                </p>
                <p className="font-body-md text-on-surface break-all">
                  {email || "—"}
                </p>
              </div>
              <div>
                <label className="block font-label-sm text-label-sm text-on-surface-variant mb-xs">
                  {t("New password")}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-surface-container-low border border-outline-variant rounded-lg pl-md pr-11 py-sm font-body-md text-on-surface focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20"
                  />
                  <button
                    type="button"
                    aria-label={
                      showPassword ? t("Hide password") : t("Show password")
                    }
                    aria-pressed={showPassword}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary"
                    onClick={() => setShowPassword((prev) => !prev)}
                  >
                    <span className="material-symbols-outlined">
                      {showPassword ? "visibility_off" : "visibility"}
                    </span>
                  </button>
                </div>
              </div>
              <button
                type="submit"
                disabled={pending || !hasRequiredParams}
                className="w-full bg-secondary text-on-secondary font-label-sm py-md rounded-lg hover:bg-secondary/90 disabled:opacity-60"
              >
                {t("Update password")}
              </button>
            </form>
            <p className="mt-md text-center font-label-sm text-on-surface-variant">
              <Link
                href="/forgot-password"
                className="text-secondary hover:underline"
              >
                {t("Request a new reset link")}
              </Link>
            </p>
          </>
        )}
        <p className="mt-lg text-center font-label-sm text-on-surface-variant">
          <Link href="/login" className="text-secondary hover:underline">
            {t("Back to sign in")}
          </Link>
        </p>
      </div>
    </div>
  );
}
