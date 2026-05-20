"use client";

import {
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { useSearchParams } from "next/navigation";
import { apiJson, userAvatarSrc } from "@/lib/api/client";
import type {
  FriendDto,
  PendingFriendRequestDto,
  UserProfileSearchDto,
} from "@/lib/api/types";
import { useDebouncedValue } from "@/lib/use-debounced-value";
import { useAuth } from "@/lib/auth/auth-context";
import { useI18n } from "@/lib/i18n";

function isValidEmail(s: string): boolean {
  const t = s.trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t);
}

function normalizeEmail(s: string): string {
  return s.trim().toLowerCase();
}

export default function FriendsPage() {
  const { t } = useI18n();
  return (
    <Suspense
      fallback={
        <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-lg font-body-md text-on-surface-variant">
          {t("Loading friends…")}
        </div>
      }
    >
      <FriendsPageContent />
    </Suspense>
  );
}

function FriendsPageContent() {
  const searchParams = useSearchParams();
  const pickerRef = useRef<HTMLDivElement>(null);
  const {
    accessToken,
    emailConfirmed,
    profile,
    loadProfile,
    apiErrorMessage,
  } = useAuth();
  const { t, locale } = useI18n();

  const [friends, setFriends] = useState<FriendDto[]>([]);
  const [pending, setPending] = useState<PendingFriendRequestDto[]>([]);
  const [nameQuery, setNameQuery] = useState("");
  const debouncedName = useDebouncedValue(nameQuery, 380);
  const [searchResults, setSearchResults] = useState<UserProfileSearchDto[]>(
    []
  );
  const [searchLoading, setSearchLoading] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [selectedUser, setSelectedUser] =
    useState<UserProfileSearchDto | null>(null);

  const [targetEmail, setTargetEmail] = useState("");
  const [useEmailInstead, setUseEmailInstead] = useState(false);

  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [emailCopied, setEmailCopied] = useState(false);

  const loadAll = useCallback(async () => {
    if (!accessToken || !emailConfirmed) {
      setFriends([]);
      setPending([]);
      return;
    }
    setErr(null);
    try {
      const [f, p] = await Promise.all([
        apiJson<FriendDto[]>("/api/friends", { accessToken }),
        apiJson<PendingFriendRequestDto[]>("/api/friends/pending", {
          accessToken,
        }),
      ]);
      setFriends(f ?? []);
      setPending(p ?? []);
    } catch (e) {
      setErr(apiErrorMessage(e));
      setFriends([]);
      setPending([]);
    }
  }, [accessToken, emailConfirmed, apiErrorMessage]);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  useEffect(() => {
    const q = searchParams.get("email");
    if (q && isValidEmail(decodeURIComponent(q))) {
      setTargetEmail(decodeURIComponent(q).trim());
      setUseEmailInstead(true);
      setSelectedUser(null);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!pickerOpen) return;
    const onDoc = (e: MouseEvent) => {
      if (!pickerRef.current?.contains(e.target as Node)) {
        setPickerOpen(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [pickerOpen]);

  useEffect(() => {
    if (!accessToken || !emailConfirmed) {
      setSearchResults([]);
      setSearchLoading(false);
      return;
    }

    const q = debouncedName.trim();
    if (q.length < 2) {
      setSearchResults([]);
      setSearchLoading(false);
      return;
    }

    const ac = new AbortController();
    let stale = false;
    setSearchLoading(true);

    void (async () => {
      try {
        const data = await apiJson<UserProfileSearchDto[]>(
          `/api/users/search?q=${encodeURIComponent(q)}`,
          { accessToken, signal: ac.signal }
        );
        if (!stale) setSearchResults(data ?? []);
      } catch {
        if (!stale) setSearchResults([]);
      } finally {
        if (!stale) setSearchLoading(false);
      }
    })();

    return () => {
      stale = true;
      ac.abort();
      setSearchLoading(false);
    };
  }, [debouncedName, accessToken, emailConfirmed]);

  async function copyMyEmail() {
    if (!profile?.email) return;
    try {
      await navigator.clipboard.writeText(profile.email);
      setEmailCopied(true);
      window.setTimeout(() => setEmailCopied(false), 2000);
    } catch {
      setErr(t("Could not copy to clipboard."));
    }
  }

  function pickUser(u: UserProfileSearchDto) {
    setSelectedUser(u);
    setNameQuery(u.name);
    setSearchResults([]);
    setPickerOpen(false);
    setUseEmailInstead(false);
    setTargetEmail("");
    setErr(null);
  }

  function clearSelection() {
    setSelectedUser(null);
    setNameQuery("");
    setSearchResults([]);
  }

  async function sendRequest(e: React.FormEvent) {
    e.preventDefault();
    if (!accessToken) return;
    setErr(null);
    setMsg(null);

    if (selectedUser) {
      if (selectedUser.id === profile?.id) {
        setErr(t("You cannot send a friend request to yourself."));
        return;
      }
      setBusy(true);
      try {
        await apiJson("/api/friends/request", {
          method: "POST",
          accessToken,
          json: {
            targetUserId: selectedUser.id,
            targetEmail: null,
          },
        });
        setMsg(t("Friend request sent."));
        clearSelection();
        await loadAll();
      } catch (e) {
        setErr(apiErrorMessage(e));
      } finally {
        setBusy(false);
      }
      return;
    }

    if (useEmailInstead) {
      const email = targetEmail.trim();
      if (!isValidEmail(email)) {
        setErr(t("Enter a valid email address for your friend’s Cayeshni account."));
        return;
      }
      if (profile?.email && normalizeEmail(email) === normalizeEmail(profile.email)) {
        setErr(t("You cannot send a friend request to yourself."));
        return;
      }
      setBusy(true);
      try {
        await apiJson("/api/friends/request", {
          method: "POST",
          accessToken,
          json: { targetEmail: email, targetUserId: null },
        });
        setMsg(t("Friend request sent."));
        setTargetEmail("");
        await loadAll();
      } catch (e) {
        setErr(apiErrorMessage(e));
      } finally {
        setBusy(false);
      }
      return;
    }

    setErr(t("Search for someone by name and pick their profile, or use email."));
  }

  async function acceptRequest(requesterId: string) {
    if (!accessToken) return;
    setErr(null);
    setMsg(null);
    setBusy(true);
    try {
      await apiJson(`/api/friends/accept/${requesterId}`, {
        method: "POST",
        accessToken,
      });
      setMsg(t("You are now friends."));
      await loadAll();
    } catch (e) {
      setErr(apiErrorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  async function removeFriend(friendId: string, name: string) {
    if (!accessToken) return;
    if (!window.confirm(t("Remove {name} from your friends list?", { name }))) {
      return;
    }
    setErr(null);
    setMsg(null);
    setBusy(true);
    try {
      await apiJson(`/api/friends/${friendId}`, {
        method: "DELETE",
        accessToken,
      });
      setMsg(t("Friend removed."));
      await loadAll();
    } catch (e) {
      setErr(apiErrorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  const canSubmitSearch =
    !!selectedUser ||
    (useEmailInstead && isValidEmail(targetEmail.trim()));

  if (!emailConfirmed) {
    return (
      <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-lg font-body-md text-on-surface-variant">
        {t("Confirm your email to use friends.")}
      </div>
    );
  }

  return (
    <div className="space-y-xl max-w-5xl">
      <header className="border-b border-outline-variant pb-lg">
        <h1 className="font-display-lg text-display-lg text-primary">{t("Friends")}</h1>
        <p className="font-body-md text-body-md text-on-surface-variant mt-xs">
          {t(
            "Search by display name, pick the right person from the list, or send by email. Accept incoming requests below."
          )}
        </p>
      </header>

      {err && (
        <div className="rounded-lg bg-error-container/40 text-error px-md py-sm font-body-md">
          {err}
        </div>
      )}
      {msg && (
        <div className="rounded-lg bg-secondary-fixed/40 text-primary px-md py-sm font-body-md">
          {msg}
        </div>
      )}

      <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-lg shadow-level-1">
        <h2 className="font-headline-md text-headline-md text-on-surface mb-sm">
          {t("Your email")}
        </h2>
        <p className="font-body-md text-on-surface-variant text-sm mb-md">
          {t("Others can send you a request with this address.")}
        </p>
        <div className="flex flex-col sm:flex-row gap-sm sm:items-stretch">
          <code className="font-mono text-xs leading-5 tracking-normal bg-surface-container-high px-2 py-1 rounded break-all min-w-0 flex-1 text-on-surface">
            {profile?.email ?? "—"}
          </code>
          <button
            type="button"
            onClick={() => void copyMyEmail()}
            disabled={!profile?.email}
            className="shrink-0 rounded border border-outline-variant bg-surface px-2 py-1 font-mono text-xs leading-5 font-normal text-on-surface hover:bg-surface-container-high disabled:opacity-50 inline-flex items-center justify-center gap-1 min-w-[6.5rem]"
          >
            {emailCopied ? (
              <>
                <span className="material-symbols-outlined text-[14px] leading-none">
                  check
                </span>
                {t("Copied")}
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[14px] leading-none">
                  content_copy
                </span>
                {t("Copy")}
              </>
            )}
          </button>
        </div>
      </div>

      <form
        onSubmit={sendRequest}
        className="rounded-xl border border-outline-variant bg-surface p-lg shadow-level-1 flex flex-col gap-md"
      >
        <h2 className="font-headline-md text-headline-md text-primary">
          {t("Send a friend request")}
        </h2>

        {!useEmailInstead ? (
          <>
            <div ref={pickerRef} className="relative">
              <label className="block font-label-sm text-label-sm text-on-surface-variant mb-xs">
                {t("Search by display name")}
              </label>
              {selectedUser ? (
                <div className="flex flex-row gap-md items-center">
                  <div className="min-w-0 flex-1 rounded-lg border border-secondary/40 bg-secondary-fixed/20 p-md flex items-center gap-md">
                    {userAvatarSrc(selectedUser.profilePictureUrl) ? (
                      <img
                        src={userAvatarSrc(selectedUser.profilePictureUrl)!}
                        alt=""
                        width={48}
                        height={48}
                        className="w-12 h-12 rounded-full object-cover border border-outline-variant shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-primary-fixed flex items-center justify-center text-primary font-headline-md shrink-0 border border-outline-variant">
                        {selectedUser.name.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="font-body-md font-semibold text-on-surface">
                        {selectedUser.name}
                      </p>
                      <p className="text-sm text-on-surface-variant truncate">
                        {selectedUser.email}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => clearSelection()}
                      className="shrink-0 text-sm font-label-sm text-secondary hover:underline px-sm"
                    >
                      {t("Change")}
                    </button>
                  </div>
                  <button
                    type="submit"
                    disabled={busy || !canSubmitSearch}
                    className="shrink-0 bg-secondary text-on-secondary font-label-sm py-sm px-md rounded-lg hover:bg-secondary/90 disabled:opacity-60 whitespace-nowrap"
                  >
                    {busy ? t("Sending…") : t("Send request")}
                  </button>
                </div>
              ) : (
                <div className="flex flex-row gap-md items-end">
                  <div className="relative min-w-0 flex-1">
                    <input
                      type="text"
                      value={nameQuery}
                      onChange={(e) => {
                        setNameQuery(e.target.value);
                        setSelectedUser(null);
                        setPickerOpen(true);
                      }}
                      onFocus={() => setPickerOpen(true)}
                      placeholder={t("Type at least 2 characters…")}
                      autoComplete="off"
                      className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-md py-sm font-body-md text-on-surface focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20"
                    />
                    {pickerOpen &&
                      nameQuery.trim().length >= 2 &&
                      !selectedUser && (
                        <div className="absolute z-40 left-0 right-0 mt-xs rounded-lg border border-outline-variant bg-surface-container-lowest shadow-level-2 max-h-72 overflow-y-auto">
                          {searchLoading ? (
                            <div className="px-md py-sm text-sm text-on-surface-variant">
                              {t("Searching…")}
                            </div>
                          ) : searchResults.length === 0 ? (
                            <div className="px-md py-sm text-sm text-on-surface-variant">
                              {t("No matching profiles.")}
                            </div>
                          ) : (
                            <ul className="py-xs">
                              {searchResults.map((u) => {
                                const src = userAvatarSrc(u.profilePictureUrl);
                                return (
                                  <li key={u.id} role="presentation">
                                    <button
                                      type="button"
                                      onMouseDown={(e) => e.preventDefault()}
                                      onClick={() => pickUser(u)}
                                      className="w-full flex items-center gap-md px-md py-sm text-left hover:bg-secondary-fixed/40 transition-colors"
                                    >
                                      {src ? (
                                        <img
                                          src={src}
                                          alt=""
                                          width={40}
                                          height={40}
                                          className="w-10 h-10 rounded-full object-cover border border-outline-variant shrink-0"
                                        />
                                      ) : (
                                        <div className="w-10 h-10 rounded-full bg-primary-fixed flex items-center justify-center text-primary font-label-sm shrink-0 border border-outline-variant">
                                          {u.name.slice(0, 2).toUpperCase()}
                                        </div>
                                      )}
                                      <div className="min-w-0 flex-1">
                                        <p className="font-body-md font-semibold text-on-surface truncate">
                                          {u.name}
                                        </p>
                                        <p className="text-xs text-on-surface-variant truncate">
                                          {u.email}
                                        </p>
                                      </div>
                                    </button>
                                  </li>
                                );
                              })}
                            </ul>
                          )}
                        </div>
                      )}
                  </div>
                  <button
                    type="submit"
                    disabled={busy || !canSubmitSearch}
                    className="shrink-0 bg-secondary text-on-secondary font-label-sm py-sm px-md rounded-lg hover:bg-secondary/90 disabled:opacity-60 whitespace-nowrap"
                  >
                    {busy ? t("Sending…") : t("Send request")}
                  </button>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => {
                setUseEmailInstead(true);
                setSelectedUser(null);
                setPickerOpen(false);
              }}
              className="block w-full text-left text-sm font-label-sm text-secondary hover:underline"
            >
              {t("I have their email instead")}
            </button>
          </>
        ) : (
          <>
            <div>
              <label className="block font-label-sm text-label-sm text-on-surface-variant mb-xs">
                {t("Their email")}
              </label>
              <div className="flex flex-row gap-md items-end">
                <input
                  type="email"
                  value={targetEmail}
                  onChange={(e) => setTargetEmail(e.target.value)}
                  placeholder={t("friend@example.com")}
                  className="min-w-0 flex-1 w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-md py-sm font-body-md text-on-surface focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20"
                  autoComplete="email"
                />
                <button
                  type="submit"
                  disabled={busy || !canSubmitSearch}
                  className="shrink-0 bg-secondary text-on-secondary font-label-sm py-sm px-md rounded-lg hover:bg-secondary/90 disabled:opacity-60 whitespace-nowrap"
                >
                  {busy ? t("Sending…") : t("Send request")}
                </button>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setUseEmailInstead(false);
                setTargetEmail("");
              }}
              className="block w-full text-left text-sm font-label-sm text-secondary hover:underline"
            >
              {t("Search by name instead")}
            </button>
          </>
        )}
      </form>

      <div className="rounded-xl border border-outline-variant bg-surface p-lg shadow-level-1">
        <h2 className="font-headline-md text-headline-md text-primary mb-md">
          {t("Incoming requests")}
        </h2>
        {pending.length === 0 ? (
          <p className="font-body-md text-on-surface-variant">
            {t("No pending requests.")}
          </p>
        ) : (
          <ul className="divide-y divide-outline-variant/40">
            {pending.map((p) => {
              const src = userAvatarSrc(p.profilePictureUrl);
              return (
                <li
                  key={p.userId}
                  className="py-md flex flex-col sm:flex-row sm:items-center sm:justify-between gap-md"
                >
                  <div className="flex items-center gap-md min-w-0 flex-1">
                    {src ? (
                      <img
                        src={src}
                        alt=""
                        width={40}
                        height={40}
                        className="w-10 h-10 rounded-full object-cover border border-outline-variant shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-primary-fixed flex items-center justify-center text-primary font-label-sm shrink-0 border border-outline-variant">
                        {p.name.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="font-body-md font-semibold text-on-surface">
                        {p.name}
                      </p>
                      <p className="text-sm text-on-surface-variant truncate">
                        {p.email}
                      </p>
                      <p className="text-xs text-on-surface-variant mt-xs">
                        {new Date(p.createdAt).toLocaleString(locale)}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void acceptRequest(p.userId)}
                    className="shrink-0 bg-primary text-on-primary font-label-sm py-sm px-md rounded-lg hover:bg-primary-container disabled:opacity-60 self-start"
                  >
                    {t("Accept")}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="rounded-xl border border-outline-variant bg-surface p-lg shadow-level-1">
        <h2 className="font-headline-md text-headline-md text-primary mb-md">
          {t("Your friends ({count})", { count: friends.length })}
        </h2>
        {friends.length === 0 ? (
          <p className="font-body-md text-on-surface-variant">
            {t("No friends yet. Send a request or accept one above.")}
          </p>
        ) : (
          <ul className="divide-y divide-outline-variant/40">
            {friends.map((f) => {
              const src = userAvatarSrc(f.profilePictureUrl);
              return (
                <li
                  key={f.userId}
                  className="py-md flex flex-col sm:flex-row sm:items-center sm:justify-between gap-md"
                >
                  <div className="flex items-center gap-md min-w-0 flex-1">
                    {src ? (
                      <img
                        src={src}
                        alt=""
                        width={40}
                        height={40}
                        className="w-10 h-10 rounded-full object-cover border border-outline-variant shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-primary-fixed flex items-center justify-center text-primary font-label-sm shrink-0 border border-outline-variant">
                        {f.name.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="font-body-md font-semibold text-on-surface">
                        {f.name}
                      </p>
                      <p className="text-sm text-on-surface-variant truncate">
                        {f.email}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void removeFriend(f.userId, f.name)}
                    className="shrink-0 text-error font-label-sm py-sm px-md rounded-lg border border-outline-variant hover:bg-error-container/20 disabled:opacity-60 self-start"
                  >
                    {t("Remove")}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
