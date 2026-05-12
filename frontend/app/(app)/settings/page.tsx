"use client";

import { useEffect, useMemo, useState } from "react";
import { apiJson } from "@/lib/api/client";
import { ListboxSelect } from "@/components/listbox-select";
import { CURRENCY_OPTIONS } from "@/lib/currency";
import { useAuth } from "@/lib/auth/auth-context";

export default function SettingsPage() {
  const {
    profile,
    accessToken,
    loadProfile,
    apiErrorMessage,
    logout,
  } = useAuth();
  const [name, setName] = useState(profile?.name ?? "");
  const [currency, setCurrency] = useState(profile?.preferredCurrency ?? 0);
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const currencyOptions = useMemo(
    () =>
      CURRENCY_OPTIONS.map((c) => ({
        value: String(c.value),
        label: c.label,
      })),
    []
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
      setMsg("Profile updated.");
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
      setMsg("Password updated.");
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
          Settings
        </h2>
        <p className="font-body-md text-body-md text-on-surface-variant mt-xs">
          Update your display name and currency, and change your password.
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
          Profile
        </h3>
        <div>
          <label className="block font-label-sm text-label-sm text-on-surface-variant mb-xs">
            Display name
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-surface border border-outline-variant rounded-lg px-md py-sm font-body-md text-on-surface"
          />
        </div>
        <div>
          <label className="block font-label-sm text-label-sm text-on-surface-variant mb-xs">
            Preferred currency
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
          Save profile
        </button>
      </form>

      <form
        onSubmit={changePassword}
        className="bg-surface-container-lowest border border-outline-variant rounded-xl p-lg shadow-level-1 space-y-md"
      >
        <h3 className="font-headline-md text-headline-md text-primary">
          Change password
        </h3>
        <div>
          <label className="block font-label-sm text-label-sm text-on-surface-variant mb-xs">
            Current password
          </label>
          <input
            type="password"
            value={currentPw}
            onChange={(e) => setCurrentPw(e.target.value)}
            className="w-full bg-surface border border-outline-variant rounded-lg px-md py-sm font-body-md text-on-surface"
            autoComplete="current-password"
          />
        </div>
        <div>
          <label className="block font-label-sm text-label-sm text-on-surface-variant mb-xs">
            New password
          </label>
          <input
            type="password"
            value={newPw}
            onChange={(e) => setNewPw(e.target.value)}
            className="w-full bg-surface border border-outline-variant rounded-lg px-md py-sm font-body-md text-on-surface"
            autoComplete="new-password"
          />
        </div>
        <button
          type="submit"
          disabled={pending}
          className="bg-primary text-on-primary font-label-sm py-sm px-md rounded-lg hover:bg-primary-container disabled:opacity-60"
        >
          Update password
        </button>
      </form>

      <button
        type="button"
        onClick={() => void logout()}
        className="text-error font-label-sm hover:underline"
      >
        Sign out everywhere on this device
      </button>
    </div>
  );
}
