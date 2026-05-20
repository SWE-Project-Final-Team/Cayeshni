"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import { apiJson } from "@/lib/api/client";
import { consumePostAuthRedirect } from "@/lib/auth/post-auth-redirect";
import { useAuth } from "@/lib/auth/auth-context";
import { useI18n } from "@/lib/i18n";

export default function ConfirmEmailPage() {
  const params = useSearchParams();
  const { apiErrorMessage, refreshSession } = useAuth();
  const { t } = useI18n();

  const [userId, setUserId] = useState("");
  const [token, setToken] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [pending, setPending] = useState(false);
  const [continueHref, setContinueHref] = useState("/dashboard");
  const [attemptedAutoConfirm, setAttemptedAutoConfirm] = useState(false);

  useEffect(() => {
    setUserId(params.get("userId") ?? "");
    setToken(params.get("token") ?? "");
  }, [params]);

  useEffect(() => {
    if (attemptedAutoConfirm || done || pending) return;
    if (!userId || !token) return;
    setAttemptedAutoConfirm(true);
    void onSubmit();
  }, [attemptedAutoConfirm, done, pending, userId, token]);

  async function onSubmit(e?: React.FormEvent) {
    e?.preventDefault();
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
    <div className="w-full max-w-full bg-surface-container-lowest rounded-2xl border border-outline-variant/30 shadow-level-2 p-lg md:p-xl md:px-12">
      <h1 className="font-headline-md text-headline-md text-primary mb-sm">
        {t("Confirm email")}
      </h1>
      {done ? (
        <p className="font-body-md text-on-surface-variant">
          {t("Thanks — your email is confirmed.")}{" "}
          <Link href={continueHref} className="text-secondary font-semibold hover:underline">
            {t("Continue")}
          </Link>
        </p>
      ) : (
        <>
          <p className="font-body-md text-body-md text-on-surface-variant mb-lg">
            {t("We&apos;re confirming your email now. If needed, you can retry below.")}
          </p>
          {err && (
            <div className="mb-md rounded-lg bg-error-container/40 text-error px-md py-sm font-body-md">
              {err}
            </div>
          )}
          <form className="space-y-md" onSubmit={onSubmit}>
            <button
              type="submit"
              disabled={pending || !userId || !token}
              className="w-full bg-secondary text-on-secondary font-label-sm py-md rounded-lg hover:bg-secondary/90 disabled:opacity-60"
            >
              {pending ? t("Confirming…") : t("Confirm email")}
            </button>
          </form>
          {!userId || !token ? (
            <p className="mt-md font-body-sm text-on-surface-variant">
              {t(
                "This link is missing required information. Request a new confirmation email from the app banner."
              )}
            </p>
          ) : null}
        </>
      )}
      <p className="mt-lg text-center font-label-sm text-on-surface-variant">
        <Link href="/login" className="text-secondary hover:underline">
          {t("Sign in")}
        </Link>
      </p>
    </div>
  );
}
