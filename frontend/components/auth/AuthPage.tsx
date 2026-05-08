"use client";

import Image from "next/image";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { login, register } from "@/lib/api/auth.api";
import { useAuthStore } from "@/store/auth.store";
import { setCookie } from "@/lib/utils/cookie-utils";

const BRAND_IMAGE =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBe2qAQ1o7B5ptUYohvGZreyVeRTDJsbI_r6lCGUyKBjABCxykkAlV-Ol4eAfCrGpa1UprlupIhP4xCv5d0zSmotVMNTtVpqbkaCPMk1-7kQy3hgF1W7b8MgjeoSfPHoMDwJRvbSvsuF_ecEhmUD7aeEdIK8TbPe8zkL_G2tQS4tTMLokuEGlB9MD-tyPHvmMBlTGGzbILG23j45dlS82TZGFAMYyq7ZT7QNZteEwmZTxFUlFWmwedUWx60lqflfKcHZEKoNwq_LhQ";

function GoogleIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden>
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

function MicrosoftIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 23 23" aria-hidden>
      <path d="M0 0h23v23H0z" fill="#f3f3f3" />
      <path d="M1 1h10v10H1z" fill="#f35325" />
      <path d="M12 1h10v10H12z" fill="#81bc06" />
      <path d="M1 12h10v10H1z" fill="#05a6f0" />
      <path d="M12 12h10v10H12z" fill="#ffba08" />
    </svg>
  );
}

function safeRedirectPath(raw: string | null): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return "/dashboard";
  return raw;
}

export function AuthPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [signupError, setSignupError] = useState<string | null>(null);
  const [signupPending, setSignupPending] = useState(false);

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      const res = await login({ email: email.trim(), password });
      useAuthStore.getState().setAccessToken(res.access);
      setCookie("session", "active", 7);
      const target = safeRedirectPath(searchParams.get("redirect"));
      router.push(target);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign in failed");
    } finally {
      setPending(false);
    }
  }

  async function handleRegister(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSignupError(null);
    setSignupPending(true);
    try {
      const res = await register({
        email: signupEmail.trim(),
        name: displayName.trim(),
        password: signupPassword,
      });
      useAuthStore.getState().setAccessToken(res.access);
      setCookie("session", "active", 7);
      const target = safeRedirectPath(searchParams.get("redirect"));
      router.push(target);
    } catch (err) {
      setSignupError(
        err instanceof Error ? err.message : "Could not create account"
      );
    } finally {
      setSignupPending(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-md text-on-background md:p-xl">
      <div className="relative flex w-full max-w-[1000px] flex-col overflow-hidden rounded-[24px] border border-outline-variant/30 bg-surface-container-lowest shadow-level-2 md:flex-row">
        {/* Branding panel */}
        <div className="relative hidden min-h-[520px] w-full flex-col justify-between overflow-hidden bg-surface-container p-xl md:flex md:w-5/12">
          <Image
            src={BRAND_IMAGE}
            alt=""
            fill
            className="object-cover"
            sizes="(min-width: 768px) 42vw, 100vw"
            priority
          />
          <div className="absolute inset-0 bg-surface/40 backdrop-blur-[2px]" />
          <div className="relative z-10">
            <h1 className="text-display-lg text-primary flex items-center gap-sm">
              <span className="material-symbols-outlined fill text-[40px] text-secondary">
                payments
              </span>
              Cayeshni
            </h1>
            <p className="text-body-lg text-on-surface-variant mt-sm">
              Clarity in shared finances.
            </p>
          </div>
          <div className="relative z-10 rounded-2xl border border-outline-variant/50 bg-surface/80 p-md shadow-level-1 backdrop-blur-md">
            <div className="mb-sm flex items-center gap-sm">
              <span className="material-symbols-outlined fill text-secondary">
                verified_user
              </span>
              <span className="text-label-sm text-primary uppercase tracking-wider">
                Bank-Grade Security
              </span>
            </div>
            <p className="text-body-md text-on-surface-variant">
              Your data is encrypted and secure. We focus on transparency so you
              can focus on collaboration.
            </p>
          </div>
        </div>

        {/* Forms */}
        <div className="relative flex w-full flex-col justify-center p-lg md:w-7/12 md:p-12">
          <div className="mb-xl text-center md:hidden">
            <h1 className="text-display-lg text-primary flex items-center justify-center gap-sm">
              <span className="material-symbols-outlined fill text-[32px] text-secondary">
                payments
              </span>
              Cayeshni
            </h1>
          </div>

          <div className="mb-xl flex border-b border-outline-variant/30">
            <button
              type="button"
              onClick={() => {
                setTab("login");
                setSignupError(null);
              }}
              className={`flex-1 cursor-pointer border-b-2 py-sm text-center text-headline-md transition-colors hover:text-primary ${
                tab === "login"
                  ? "border-secondary text-primary"
                  : "border-transparent text-on-surface-variant"
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setTab("signup");
                setError(null);
              }}
              className={`flex-1 cursor-pointer border-b-2 py-sm text-center text-headline-md transition-colors hover:text-primary ${
                tab === "signup"
                  ? "border-secondary text-primary"
                  : "border-transparent text-on-surface-variant"
              }`}
            >
              Create Account
            </button>
          </div>

          {tab === "login" && (
            <div className="animate-fade-in space-y-xl">
              <form className="space-y-md" noValidate onSubmit={handleLogin}>
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
                    htmlFor="login-email"
                    className="text-label-sm text-on-surface-variant mb-xs block"
                  >
                    Email Address
                  </label>
                  <input
                    id="login-email"
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
                <div>
                  <div className="mb-xs flex items-center justify-between">
                    <label
                      htmlFor="login-password"
                      className="text-label-sm text-on-surface-variant block"
                    >
                      Password
                    </label>
                    <a
                      href="#"
                      className="text-label-sm text-secondary hover:underline"
                    >
                      Forgot?
                    </a>
                  </div>
                  <input
                    id="login-password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    placeholder="••••••••"
                    className="input-field"
                    value={password}
                    onChange={(ev) => setPassword(ev.target.value)}
                    disabled={pending}
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={pending}
                  className="text-label-sm flex w-full items-center justify-center gap-sm rounded-lg bg-secondary py-md text-on-secondary shadow-sm transition-all hover:bg-secondary/90 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {pending ? "Signing in…" : "Sign In"}
                  <span className="material-symbols-outlined text-[18px]">
                    arrow_forward
                  </span>
                </button>
              </form>

              <div className="relative flex items-center py-sm">
                <div className="border-outline-variant/30 flex-grow border-t" />
                <span className="text-label-sm text-on-surface-variant mx-md shrink-0 uppercase tracking-wider">
                  Or continue with
                </span>
                <div className="border-outline-variant/30 flex-grow border-t" />
              </div>

              <div className="grid grid-cols-2 gap-md">
                <button
                  type="button"
                  className="text-label-sm flex items-center justify-center gap-sm rounded-lg border border-outline-variant bg-surface-container-lowest px-md py-sm text-primary transition-colors hover:bg-surface-container-low"
                >
                  <GoogleIcon />
                  Google
                </button>
                <button
                  type="button"
                  className="text-label-sm flex items-center justify-center gap-sm rounded-lg border border-outline-variant bg-surface-container-lowest px-md py-sm text-primary transition-colors hover:bg-surface-container-low"
                >
                  <MicrosoftIcon />
                  Microsoft
                </button>
              </div>
            </div>
          )}

          {tab === "signup" && (
            <form
              className="animate-fade-in space-y-xl"
              noValidate
              onSubmit={handleRegister}
            >
              {signupError ? (
                <p
                  className="text-label-sm rounded-lg border border-error/40 bg-error-container/30 px-md py-sm text-error"
                  role="alert"
                >
                  {signupError}
                </p>
              ) : null}
              <div className="space-y-lg">
                <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-low p-md">
                  <h3 className="text-headline-md text-primary mb-md flex items-center gap-sm">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-secondary text-[12px] font-bold text-on-secondary">
                      1
                    </span>
                    Account Setup
                  </h3>
                  <div className="space-y-md">
                    <div>
                      <label
                        htmlFor="signup-email"
                        className="text-label-sm text-on-surface-variant mb-xs block"
                      >
                        Email Address
                      </label>
                      <input
                        id="signup-email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        placeholder="you@example.com"
                        className="input-field"
                        value={signupEmail}
                        onChange={(ev) => setSignupEmail(ev.target.value)}
                        disabled={signupPending}
                        required
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="signup-password"
                        className="text-label-sm text-on-surface-variant mb-xs block"
                      >
                        Password
                      </label>
                      <input
                        id="signup-password"
                        name="password"
                        type="password"
                        autoComplete="new-password"
                        placeholder="Create a strong password"
                        className="input-field"
                        value={signupPassword}
                        onChange={(ev) => setSignupPassword(ev.target.value)}
                        disabled={signupPending}
                        required
                        minLength={1}
                      />
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-low p-md">
                  <h3 className="text-headline-md text-primary mb-md flex items-center gap-sm">
                    <span className="border-outline-variant text-outline-variant flex h-6 w-6 items-center justify-center rounded-full border-2 text-[12px] font-bold text-secondary">
                      2
                    </span>
                    Profile &amp; Preferences
                  </h3>
                  <div className="space-y-md">
                    <div>
                      <label
                        htmlFor="display-name"
                        className="text-label-sm text-on-surface-variant mb-xs block"
                      >
                        Display Name
                      </label>
                      <input
                        id="display-name"
                        name="displayName"
                        type="text"
                        autoComplete="name"
                        placeholder="At least 3 characters"
                        className="input-field"
                        value={displayName}
                        onChange={(ev) => setDisplayName(ev.target.value)}
                        disabled={signupPending}
                        required
                        minLength={3}
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="currency"
                        className="text-label-sm text-on-surface-variant mb-xs block"
                      >
                        Default Currency
                      </label>
                      <select
                        id="currency"
                        name="currency"
                        value={currency}
                        onChange={(ev) => setCurrency(ev.target.value)}
                        disabled={signupPending}
                        className="input-field appearance-none"
                      >
                        <option value="USD">USD ($) - US Dollar</option>
                        <option value="EUR">EUR (€) - Euro</option>
                        <option value="GBP">GBP (£) - British Pound</option>
                      </select>
                      <p className="text-label-sm text-on-surface-variant mt-xs normal-case tracking-normal">
                        Saved in the app soon; not sent when you sign up.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-low p-md">
                  <h3 className="text-headline-md text-primary mb-md flex items-center gap-sm">
                    <span className="border-outline-variant text-outline-variant flex h-6 w-6 items-center justify-center rounded-full border-2 text-[12px] font-bold">
                      3
                    </span>
                    Get Started
                  </h3>
                  <button
                    type="submit"
                    disabled={signupPending}
                    className="text-label-sm mb-md flex w-full items-center justify-center gap-sm rounded-lg bg-secondary py-md text-on-secondary shadow-sm transition-all hover:bg-secondary/90 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {signupPending ? "Creating account…" : "Create account"}
                    <span className="material-symbols-outlined text-[18px]">
                      arrow_forward
                    </span>
                  </button>
                  <div className="grid grid-cols-1 gap-md">
                    <button
                      type="button"
                      className="text-label-sm flex w-full items-center justify-center gap-sm rounded-lg border border-secondary bg-surface-container-lowest py-md text-primary shadow-sm transition-all hover:bg-surface-container-low"
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        group_add
                      </span>
                      Create a New Group
                    </button>
                    <button
                      type="button"
                      className="text-label-sm flex w-full items-center justify-center gap-sm rounded-lg border border-outline-variant bg-surface-container-lowest py-md text-primary shadow-sm transition-all hover:bg-surface-container-low"
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        login
                      </span>
                      Join Existing Group
                    </button>
                  </div>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
