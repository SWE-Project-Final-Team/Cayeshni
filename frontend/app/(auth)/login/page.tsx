"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/auth/auth-context";
import { apiJson } from "@/lib/api/client";
import {
  resolvePostAuthDestination,
  sanitizePostAuthPath,
  storePostAuthRedirect,
} from "@/lib/auth/post-auth-redirect";
import { ListboxSelect } from "@/components/listbox-select";
import { MoneyLoadingScreen } from "@/components/money-loading-screen";
import { CURRENCY_OPTIONS } from "@/lib/currency";

export default function LoginPage() {
  const router = useRouter();
  const {
    login,
    register,
    logout,
    accessToken,
    bootstrapping,
    emailConfirmed,
    profile,
    accountEmail,
    apiErrorMessage,
  } = useAuth();
  const [tab, setTab] = useState<"login" | "register">("login");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [resendMsg, setResendMsg] = useState<string | null>(null);

  const currencyOptions = useMemo(
    () =>
      CURRENCY_OPTIONS.map((c) => ({
        value: String(c.value),
        label: c.label,
      })),
    []
  );

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [regName, setRegName] = useState("");
  const [regCurrency, setRegCurrency] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = new URLSearchParams(window.location.search).get("next");
    const next = sanitizePostAuthPath(raw);
    if (next) storePostAuthRedirect(next);
  }, []);

  useEffect(() => {
    if (bootstrapping || !accessToken) return;
    if (!emailConfirmed) return;
    router.replace(resolvePostAuthDestination());
  }, [bootstrapping, accessToken, emailConfirmed, router]);

  async function resendConfirmation() {
    const email = profile?.email ?? accountEmail;
    if (!email) return;
    setResendMsg(null);
    try {
      await apiJson("/api/auth/resend-confirmation", {
        method: "POST",
        json: { email },
      });
      setResendMsg("If your account is unconfirmed, check your inbox.");
    } catch (err) {
      setResendMsg(apiErrorMessage(err));
    }
  }

  async function onLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      await login(loginEmail, loginPassword);
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setPending(false);
    }
  }

  async function onRegister(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      await register({
        email: regEmail,
        name: regName,
        password: regPassword,
        preferredCurrency: regCurrency,
      });
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setPending(false);
    }
  }

  if (bootstrapping) {
    return <MoneyLoadingScreen message="Opening the ledger…" />;
  }

  return (
    <main className="w-full max-w-[1000px] bg-surface-container-lowest rounded-[24px] shadow-level-2 border border-outline-variant/30 flex flex-col md:flex-row overflow-hidden relative">
      <div
        className="hidden md:flex flex-col justify-start w-5/12 bg-surface-container p-xl relative overflow-hidden"
        style={{
          backgroundImage:
            "linear-gradient(135deg, rgba(251,249,250,0.92), rgba(239,237,239,0.95)), url(https://lh3.googleusercontent.com/aida-public/AB6AXuBe2qAQ1o7B5ptUYohvGZreyVeRTDJsbI_r6lCGUyKBjABCxykkAlV-Ol4eAfCrGpa1UprlupIhP4xCv5d0zSmotVMNTtVpqbkaCPMk1-7kQy3hgF1W7b8MgjeoSfPHoMDwJRvbSvsuF_ecEhmUD7aeEdIK8TbPe8zkL_G2tQS4tTMLokuEGlB9MD-tyPHvmMBlTGGzbILG23j45dlS82TZGFAMYyq7ZT7QNZteEwmZTxFUlFWmwedUWx60lqflfKcHZEKoNwq_LhQ)",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-surface/40 backdrop-blur-[2px]" />
        <div className="relative z-10">
          <h1 className="font-display-lg text-display-lg text-primary flex items-center gap-sm">
            <span className="material-symbols-outlined fill text-[40px] text-secondary">
              payments
            </span>
            Cayeshni
          </h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant mt-sm">
            Clarity in shared finances.
          </p>
        </div>
      </div>

      <div className="w-full md:w-7/12 p-lg md:p-12 flex flex-col justify-center relative">
        <div className="md:hidden mb-xl text-center">
          <h1 className="font-display-lg text-display-lg text-primary flex items-center justify-center gap-sm">
            <span className="material-symbols-outlined fill text-[32px] text-secondary">
              payments
            </span>
            Cayeshni
          </h1>
        </div>

        {accessToken && !emailConfirmed && (
          <div
            className="mb-lg rounded-xl border border-outline-variant/40 bg-tertiary-fixed/25 text-on-surface px-md py-md space-y-sm"
            role="status"
          >
            <p className="font-body-md text-body-md text-on-surface">
              Your email is not verified yet. Open the link we sent you to unlock
              your account, or request a new message below.
            </p>
            <div className="flex flex-wrap items-center gap-sm">
              <button
                type="button"
                onClick={() => void resendConfirmation()}
                className="inline-flex items-center gap-xs bg-secondary text-on-secondary font-label-sm py-sm px-md rounded-lg hover:bg-secondary/90"
              >
                Resend verification link
              </button>
              <button
                type="button"
                onClick={() => void logout()}
                className="font-label-sm text-secondary hover:underline"
              >
                Sign out
              </button>
            </div>
            {resendMsg && (
              <p className="font-body-sm text-on-surface-variant">{resendMsg}</p>
            )}
          </div>
        )}

        <div className="flex mb-xl border-b border-outline-variant/30">
          <button
            type="button"
            onClick={() => setTab("login")}
            className={`flex-1 text-center py-sm font-headline-md text-headline-md border-b-2 transition-colors ${
              tab === "login"
                ? "border-secondary text-primary"
                : "border-transparent text-on-surface-variant hover:text-primary"
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => setTab("register")}
            className={`flex-1 text-center py-sm font-headline-md text-headline-md border-b-2 transition-colors ${
              tab === "register"
                ? "border-secondary text-primary"
                : "border-transparent text-on-surface-variant hover:text-primary"
            }`}
          >
            Create Account
          </button>
        </div>

        {error && (
          <div
            className="mb-md rounded-lg border border-error/40 bg-error-container/30 text-error px-md py-sm font-body-md text-body-md"
            role="alert"
          >
            {error}
          </div>
        )}

        {tab === "login" ? (
          <form className="space-y-xl" onSubmit={onLogin}>
            <div className="space-y-md">
              <div>
                <label className="block font-label-sm text-label-sm text-on-surface-variant mb-xs">
                  Email
                </label>
                <input
                  className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-md py-sm font-body-md text-body-md text-on-surface focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20"
                  type="email"
                  autoComplete="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  required
                />
              </div>
              <div>
                <div className="flex justify-between items-center mb-xs">
                  <label className="block font-label-sm text-label-sm text-on-surface-variant">
                    Password
                  </label>
                  <Link
                    href="/forgot-password"
                    className="font-label-sm text-label-sm text-secondary hover:underline"
                  >
                    Forgot?
                  </Link>
                </div>
                <div className="relative">
                  <input
                    className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg pl-md pr-11 py-sm font-body-md text-body-md text-on-surface focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20"
                    type={showLoginPassword ? "text" : "password"}
                    autoComplete="current-password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    aria-label={showLoginPassword ? "Hide password" : "Show password"}
                    aria-pressed={showLoginPassword}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary"
                    onClick={() => setShowLoginPassword((prev) => !prev)}
                  >
                    <span className="material-symbols-outlined">
                      {showLoginPassword ? "visibility_off" : "visibility"}
                    </span>
                  </button>
                </div>
              </div>
            </div>
            <button
              type="submit"
              disabled={pending}
              className="w-full bg-secondary text-on-secondary font-label-sm text-label-sm py-md rounded-lg shadow-sm hover:shadow-md hover:bg-secondary/90 transition-all flex justify-center items-center gap-sm disabled:opacity-60"
            >
              Sign In
              <span className="material-symbols-outlined text-[18px]">
                arrow_forward
              </span>
            </button>
          </form>
        ) : (
          <form className="space-y-lg" onSubmit={onRegister}>
            <div className="bg-surface-container-low p-md rounded-2xl border border-outline-variant/30 space-y-md">
              <h3 className="font-headline-md text-headline-md text-primary mb-md flex items-center gap-sm">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-secondary text-on-secondary text-[12px] font-bold">
                  1
                </span>
                Account
              </h3>
              <div>
                <label className="block font-label-sm text-label-sm text-on-surface-variant mb-xs">
                  Email
                </label>
                <input
                  className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-md py-sm font-body-md text-body-md text-on-surface focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20"
                  type="email"
                  autoComplete="email"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block font-label-sm text-label-sm text-on-surface-variant mb-xs">
                  Password
                </label>
                <div className="relative">
                  <input
                    className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg pl-md pr-11 py-sm font-body-md text-body-md text-on-surface focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20"
                    type={showRegPassword ? "text" : "password"}
                    autoComplete="new-password"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    aria-label={showRegPassword ? "Hide password" : "Show password"}
                    aria-pressed={showRegPassword}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary"
                    onClick={() => setShowRegPassword((prev) => !prev)}
                  >
                    <span className="material-symbols-outlined">
                      {showRegPassword ? "visibility_off" : "visibility"}
                    </span>
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-surface-container-low p-md rounded-2xl border border-outline-variant/30 space-y-md">
              <h3 className="font-headline-md text-headline-md text-primary mb-md flex items-center gap-sm">
                <span className="flex items-center justify-center w-6 h-6 rounded-full border-2 border-outline-variant text-outline-variant text-[12px] font-bold">
                  2
                </span>
                Profile
              </h3>
              <div>
                <label className="block font-label-sm text-label-sm text-on-surface-variant mb-xs">
                  Display name
                </label>
                <input
                  className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-md py-sm font-body-md text-body-md text-on-surface focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  placeholder="How should we call you?"
                  required
                  minLength={3}
                />
              </div>
              <div>
                <label className="block font-label-sm text-label-sm text-on-surface-variant mb-xs">
                  Default currency
                </label>
                <ListboxSelect
                  value={String(regCurrency)}
                  onChange={(v) => setRegCurrency(Number(v))}
                  options={currencyOptions}
                  placeholder="Select currency"
                  leadingIcon="payments"
                  className="w-full"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={pending}
              className="w-full bg-secondary text-on-secondary font-label-sm text-label-sm py-md rounded-lg shadow-sm hover:shadow-md hover:bg-secondary/90 transition-all flex justify-center items-center gap-sm disabled:opacity-60"
            >
              Create account
              <span className="material-symbols-outlined text-[18px]">
                group_add
              </span>
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
