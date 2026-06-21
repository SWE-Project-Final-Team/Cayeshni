"use client";

import { useEffect, useMemo, useState } from "react";
import { apiJson } from "@/lib/api/client";
import { ListboxSelect } from "@/components/listbox-select";
import { CURRENCY_OPTIONS } from "@/lib/currency";
import { useAuth } from "@/lib/auth/auth-context";
import { useI18n } from "@/lib/i18n";

export default function SettingsPage() {
  const { profile, accessToken, loadProfile, apiErrorMessage, logout } =
    useAuth();
  const { t } = useI18n();
  const [name, setName] = useState(profile?.name ?? "");
  const [currency, setCurrency] = useState(profile?.preferredCurrency ?? 0);
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const currencyOptions = useMemo(
    () =>
      CURRENCY_OPTIONS.map((c) => ({
        value: String(c.value),
        label: c.label,
      })),
    [],
  );

  useEffect(() => {
    if (profile) {
      setName(profile.name);
      setCurrency(profile.preferredCurrency);
    }
  }, [profile]);

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!accessToken) return;
    setErr(null);
    setMsg(null);
    setPending(true);
    try {
      await apiJson("/api/users/me", {
        method: "PUT",
        accessToken,
        json: { name, preferredCurrency: currency },
      });
      await loadProfile();
      setMsg(t("Profile updated."));
    } catch (e) {
      setErr(apiErrorMessage(e));
    } finally {
      setPending(false);
    }
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    if (!accessToken) return;
    setErr(null);
    setMsg(null);
    setPending(true);
    try {
      await apiJson("/api/auth/change-password", {
        method: "POST",
        accessToken,
        json: { currentPassword: currentPw, newPassword: newPw },
      });
      setCurrentPw("");
      setNewPw("");
      setMsg(t("Password updated."));
    } catch (e) {
      setErr(apiErrorMessage(e));
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="w-full space-y-xl">
      <div>
        <h2 className="font-display-lg text-display-lg text-on-surface">
          {t("Settings")}
        </h2>
        <p className="font-body-md text-body-md text-on-surface-variant mt-xs">
          {t(
            "Update your display name and currency, and change your password.",
          )}
        </p>
      </div>

      {msg && (
        <div className="rounded-lg bg-secondary-fixed/40 text-primary px-md py-sm font-body-md">
          {msg}
        </div>
      )}
      {err && (
        <div className="rounded-lg bg-error-container/40 text-error px-md py-sm font-body-md">
          {err}
        </div>
      )}

      <form
        onSubmit={saveProfile}
        className="bg-surface-container-lowest border border-outline-variant rounded-xl p-lg shadow-level-1 space-y-md"
      >
        <h3 className="font-headline-md text-headline-md text-primary">
          {t("Profile")}
        </h3>
        <div>
          <label className="block font-label-sm text-label-sm text-on-surface-variant mb-xs">
            {t("Display name")}
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-surface border border-outline-variant rounded-lg px-md py-sm font-body-md text-on-surface"
          />
        </div>
        <div>
          <label className="block font-label-sm text-label-sm text-on-surface-variant mb-xs">
            {t("Preferred currency")}
          </label>
          <ListboxSelect
            value={String(currency)}
            onChange={(v) => setCurrency(Number(v))}
            options={currencyOptions}
            placeholder="Select currency"
            leadingIcon="payments"
            className="w-full"
          />
        </div>
        <button
          type="submit"
          disabled={pending}
          className="bg-secondary text-on-secondary font-label-sm py-sm px-md rounded-lg hover:bg-secondary/90 disabled:opacity-60"
        >
          {t("Save profile")}
        </button>
      </form>

      <form
        onSubmit={changePassword}
        className="bg-surface-container-lowest border border-outline-variant rounded-xl p-lg shadow-level-1 space-y-md"
      >
        <h3 className="font-headline-md text-headline-md text-primary">
          {t("Change password")}
        </h3>
        <div>
          <label className="block font-label-sm text-label-sm text-on-surface-variant mb-xs">
            {t("Current password")}
          </label>
          <div className="relative">
            <input
              type={showCurrentPw ? "text" : "password"}
              value={currentPw}
              onChange={(e) => setCurrentPw(e.target.value)}
              className="w-full bg-surface border border-outline-variant rounded-lg pl-md pr-11 py-sm font-body-md text-on-surface"
              autoComplete="current-password"
            />
            <button
              type="button"
              aria-label={
                showCurrentPw ? t("Hide password") : t("Show password")
              }
              aria-pressed={showCurrentPw}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary"
              onClick={() => setShowCurrentPw((prev) => !prev)}
            >
              <span className="material-symbols-outlined">
                {showCurrentPw ? "visibility_off" : "visibility"}
              </span>
            </button>
          </div>
        </div>
        <div>
          <label className="block font-label-sm text-label-sm text-on-surface-variant mb-xs">
            {t("New password")}
          </label>
          <div className="relative">
            <input
              type={showNewPw ? "text" : "password"}
              value={newPw}
              onChange={(e) => setNewPw(e.target.value)}
              className="w-full bg-surface border border-outline-variant rounded-lg pl-md pr-11 py-sm font-body-md text-on-surface"
              autoComplete="new-password"
            />
            <button
              type="button"
              aria-label={showNewPw ? t("Hide password") : t("Show password")}
              aria-pressed={showNewPw}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary"
              onClick={() => setShowNewPw((prev) => !prev)}
            >
              <span className="material-symbols-outlined">
                {showNewPw ? "visibility_off" : "visibility"}
              </span>
            </button>
          </div>
        </div>
        <button
          type="submit"
          disabled={pending}
          className="bg-primary text-on-primary font-label-sm py-sm px-md rounded-lg hover:bg-primary-container disabled:opacity-60"
        >
          {t("Update password")}
        </button>
      </form>

      <button
        type="button"
        onClick={() => void logout()}
        className="text-error font-label-sm hover:underline"
      >
        {t("Sign out everywhere on this device")}
      </button>
    </div>
  );
}
