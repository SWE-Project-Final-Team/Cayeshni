"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { apiJson, apiMultipartJson, mediaUrl } from "@/lib/api/client";
import { ListboxSelect } from "@/components/listbox-select";
import { CURRENCY_OPTIONS, currencyCode, currencyValueFromApi } from "@/lib/currency";
import { useAuth } from "@/lib/auth/auth-context";
import type { UserProfile } from "@/lib/auth/auth-context";

export default function ProfilePage() {
  const {
    accessToken,
    emailConfirmed,
    profile,
    loadProfile,
    apiErrorMessage,
  } = useAuth();

  const [local, setLocal] = useState<UserProfile | null>(null);
  const [name, setName] = useState("");
  const [currency, setCurrency] = useState(0);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const refresh = useCallback(async () => {
    if (!accessToken || !emailConfirmed) {
      setLocal(null);
      return;
    }
    setErr(null);
    try {
      const raw = await apiJson<UserProfile & { preferredCurrency?: string | number }>(
        "/api/users/me",
        { accessToken }
      );
      const me: UserProfile = {
        ...raw,
        preferredCurrency: currencyValueFromApi(raw.preferredCurrency),
      };
      setLocal(me);
      setName(me.name);
      setCurrency(me.preferredCurrency);
      await loadProfile();
    } catch (e) {
      setErr(apiErrorMessage(e));
      setLocal(null);
    }
  }, [accessToken, emailConfirmed, loadProfile, apiErrorMessage]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (profile && emailConfirmed) {
      setName(profile.name);
      setCurrency(currencyValueFromApi(profile.preferredCurrency));
    }
  }, [profile, emailConfirmed]);

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
      setMsg("Profile updated.");
      await refresh();
    } catch (e) {
      setErr(apiErrorMessage(e));
    } finally {
      setPending(false);
    }
  }

  async function onPickFile(f: File | null) {
    if (!f || !accessToken) return;
    setErr(null);
    setMsg(null);
    setPending(true);
    try {
      const fd = new FormData();
      fd.append("file", f);
      await apiMultipartJson<{ pictureUrl: string }>(
        "/api/users/me/picture",
        fd,
        accessToken
      );
      setMsg("Photo updated.");
      await refresh();
    } catch (e) {
      setErr(apiErrorMessage(e));
    } finally {
      setPending(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function removePhoto() {
    if (!accessToken) return;
    setErr(null);
    setMsg(null);
    setPending(true);
    try {
      await apiJson("/api/users/me/picture", {
        method: "DELETE",
        accessToken,
      });
      setMsg("Photo removed.");
      await refresh();
    } catch (e) {
      setErr(apiErrorMessage(e));
    } finally {
      setPending(false);
    }
  }

  const display = local ?? profile;
  const avatarUrl = mediaUrl(display?.profilePictureUrl);

  const currencyOptions = useMemo(
    () =>
      CURRENCY_OPTIONS.map((c) => ({
        value: String(c.value),
        label: c.label,
      })),
    []
  );

  if (!emailConfirmed) {
    return (
      <div className="w-full space-y-lg max-w-2xl">
        <h2 className="font-display-lg text-display-lg text-on-surface">Profile</h2>
        <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-lg shadow-level-1 font-body-md text-on-surface-variant">
          Confirm your email to view and edit your profile. After you use the
          link in your inbox, refresh this page.
        </div>
        <Link
          href="/login"
          className="inline-flex text-secondary font-label-sm hover:underline"
        >
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full space-y-xl">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-md">
        <div>
          <h2 className="font-display-lg text-display-lg text-on-surface">Profile</h2>
          <p className="font-body-md text-body-md text-on-surface-variant mt-xs">
            Manage your photo, display name, and default currency.
          </p>
        </div>
        <Link
          href="/settings"
          className="font-label-sm text-secondary hover:underline shrink-0"
        >
          Password &amp; security →
        </Link>
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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-lg">
        <div className="lg:col-span-5">
          <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-lg shadow-level-1 flex flex-col items-center text-center">
            <div className="relative mb-md">
              {avatarUrl ? (
                <Image
                  src={avatarUrl}
                  alt=""
                  width={160}
                  height={160}
                  className="w-40 h-40 rounded-full object-cover border-4 border-surface shadow-level-2"
                  unoptimized
                />
              ) : (
                <div className="w-40 h-40 rounded-full bg-primary-fixed flex items-center justify-center text-primary font-display-lg text-display-lg border-4 border-surface shadow-level-2">
                  {(display?.name ?? "?").slice(0, 1).toUpperCase()}
                </div>
              )}
            </div>
            <p className="font-headline-md text-headline-md text-on-surface">
              {display?.name ?? "—"}
            </p>
            <p className="font-body-md text-on-surface-variant break-all mt-xs">
              {display?.email ?? "—"}
            </p>
            {display?.createdAt && (
              <p className="font-label-sm text-on-surface-variant mt-md">
                Member since{" "}
                {new Date(display.createdAt).toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            )}
            <p className="font-label-sm text-on-surface-variant mt-sm">
              Default currency:{" "}
              <span className="text-on-surface font-semibold">
                {display != null ? currencyCode(display.preferredCurrency) : "—"}
              </span>
            </p>

            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => void onPickFile(e.target.files?.[0] ?? null)}
            />
            <div className="flex flex-wrap gap-sm justify-center mt-lg w-full">
              <button
                type="button"
                disabled={pending}
                onClick={() => fileRef.current?.click()}
                className="bg-secondary text-on-secondary font-label-sm py-sm px-md rounded-lg hover:bg-secondary/90 disabled:opacity-60"
              >
                Change photo
              </button>
              {avatarUrl && (
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => void removePhoto()}
                  className="border border-outline-variant text-primary font-label-sm py-sm px-md rounded-lg hover:bg-surface-container-high disabled:opacity-60"
                >
                  Remove photo
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-7">
          <form
            onSubmit={saveProfile}
            className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-lg shadow-level-1 space-y-md"
          >
            <h3 className="font-headline-md text-headline-md text-primary">
              Edit details
            </h3>
            <div>
              <label className="block font-label-sm text-label-sm text-on-surface-variant mb-xs">
                Display name
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                minLength={3}
                required
                className="w-full bg-surface border border-outline-variant rounded-lg px-md py-sm font-body-md text-on-surface focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20"
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
              className="bg-primary text-on-primary font-label-sm py-sm px-md rounded-lg hover:bg-primary-container disabled:opacity-60"
            >
              Save changes
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
