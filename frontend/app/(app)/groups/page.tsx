"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { apiJson } from "@/lib/api/client";
import type { GroupDto, PendingGroupInviteDto } from "@/lib/api/types";
import { currencyCode } from "@/lib/currency";
import { storePostAuthRedirect } from "@/lib/auth/post-auth-redirect";
import { useAuth } from "@/lib/auth/auth-context";
import { buildGroupJoinUrl } from "@/lib/group-invite";
import {
  storePendingGroupInvite,
  consumePendingGroupInvite,
} from "@/lib/group-pending-invite";
import { InviteFriendToGroup } from "@/components/invite-friend-to-group";
import { useI18n } from "@/lib/i18n";

export default function GroupsPage() {
  const router = useRouter();
  const { accessToken, emailConfirmed, apiErrorMessage, profile } = useAuth();
  const { t, locale } = useI18n();
  const [groups, setGroups] = useState<GroupDto[]>([]);
  const [name, setName] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [joinToken, setJoinToken] = useState("");
  const [joinErr, setJoinErr] = useState<string | null>(null);
  const [joinBusy, setJoinBusy] = useState(false);
  const [shareHint, setShareHint] = useState<string | null>(null);
  const [autoJoining, setAutoJoining] = useState(false);
  const autoJoinAttempted = useRef(false);
  const [pendingInvites, setPendingInvites] = useState<PendingGroupInviteDto[]>(
    [],
  );
  const [invitesLoading, setInvitesLoading] = useState(false);
  const [inviteActionErr, setInviteActionErr] = useState<string | null>(null);

  const loadInvites = useCallback(async () => {
    if (!accessToken || !emailConfirmed) return;
    setInvitesLoading(true);
    try {
      const data = await apiJson<PendingGroupInviteDto[]>(
        "/api/groups/pending-invites",
        { accessToken },
      );
      setPendingInvites(data);
      setInviteActionErr(null);
    } catch (e) {
      setInviteActionErr(apiErrorMessage(e));
      setPendingInvites([]);
    } finally {
      setInvitesLoading(false);
    }
  }, [accessToken, emailConfirmed, apiErrorMessage]);

  const load = useCallback(async () => {
    if (!accessToken || !emailConfirmed) return;
    setLoading(true);
    setErr(null);
    try {
      const data = await apiJson<GroupDto[]>("/api/groups", { accessToken });
      setGroups(data);
    } catch (e) {
      setErr(apiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [accessToken, emailConfirmed, apiErrorMessage]);

  useEffect(() => {
    void loadInvites();
  }, [loadInvites]);

  useEffect(() => {
    void load();
  }, [load]);

  /**
   * Handle invite link for unauthenticated users.
   * If user is not yet authenticated, redirect to login with a return path.
   * If already authenticated, the other useEffect handles auto-join.
   */
  useEffect(() => {
    if (typeof window === "undefined") return;
    const inv = new URLSearchParams(window.location.search).get("invite");
    if (!inv) return;

    if (accessToken && emailConfirmed) {
      // Already authenticated: the other useEffect will handle auto-join
      return;
    }

    if (!accessToken) {
      // Not authenticated: store token and redirect to login
      storePendingGroupInvite(inv);
      const returnPath = `/groups?invite=${encodeURIComponent(inv)}`;
      storePostAuthRedirect(returnPath);
      router.replace("/login", { scroll: false });
    }
  }, [router, accessToken, emailConfirmed]);

  /**
   * Auto-join when user is authenticated and has a pending invite.
   * Handles both:
   * - Invite link opened while already authenticated
   * - Return from auth flow with stored invite token
   */
  useEffect(() => {
    if (!accessToken || !emailConfirmed) return;
    if (autoJoinAttempted.current) return;

    // Check session storage for stored token from unauthenticated invite link
    let pendingToken = consumePendingGroupInvite();

    // Also check URL in case we were redirected here after login with ?invite=TOKEN
    if (!pendingToken && typeof window !== "undefined") {
      const inv = new URLSearchParams(window.location.search).get("invite");
      if (inv) {
        pendingToken = inv;
      }
    }

    if (!pendingToken) return;

    autoJoinAttempted.current = true;
    setAutoJoining(true);

    autoJoinGroup(pendingToken);
  }, [accessToken, emailConfirmed]);

  async function shareGroup(g: GroupDto) {
    setShareHint(null);
    const url = buildGroupJoinUrl(g.inviteToken);
    const text = t(
      'You\'re invited to join "{group}" on Cayeshni.\n\nOpen: {url}\n\nOr enter this invite code: {inviteToken}',
      { group: g.name, url, inviteToken: g.inviteToken },
    );

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: t("Join {group} on Cayeshni", { group: g.name }),
          text,
          url,
        });
        return;
      } catch (e: unknown) {
        const name =
          e && typeof e === "object" && "name" in e
            ? String((e as { name: unknown }).name)
            : "";
        if (name === "AbortError") return;
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      setShareHint(t('Join link copied for "{group}".', { group: g.name }));
    } catch {
      try {
        await navigator.clipboard.writeText(g.inviteToken);
        setShareHint(t('Invite code copied for "{group}".', { group: g.name }));
      } catch {
        setShareHint(
          t(
            "Could not copy automatically — copy the invite code from the list.",
          ),
        );
      }
    }
    window.setTimeout(() => setShareHint(null), 4000);
  }

  /**
   * Auto-join a group from an invite token.
   * Used when user arrives via invite link and is already authenticated.
   * Falls back to manual join if it fails.
   */
  async function autoJoinGroup(token: string): Promise<void> {
    if (!accessToken || !token.trim()) return;

    try {
      const joined = await apiJson<GroupDto>("/api/groups/join", {
        method: "POST",
        accessToken,
        json: { inviteToken: token },
      });
      await Promise.all([load(), loadInvites()]);
      // Navigate to group detail on success (after join completes)
      router.push(`/groups/${joined.id}`);
    } catch (e) {
      // Auto-join failed: show error and let user manually join as fallback
      setJoinErr(apiErrorMessage(e));
      setJoinToken(token);
      setAutoJoining(false);
      
      // Clean up URL parameter on error
      if (typeof window !== "undefined") {
        router.replace("/groups", { scroll: false });
      }
    }
  }

  async function joinGroup(e: React.FormEvent) {
    e.preventDefault();
    if (!accessToken) return;
    const token = joinToken.trim();
    if (!token) return;
    setJoinErr(null);
    setJoinBusy(true);
    try {
      const joined = await apiJson<GroupDto>("/api/groups/join", {
        method: "POST",
        accessToken,
        json: { inviteToken: token },
      });
      setJoinToken("");
      await load();
      await loadInvites();
      router.push(`/groups/${joined.id}`);
    } catch (e) {
      setJoinErr(apiErrorMessage(e));
    } finally {
      setJoinBusy(false);
    }
  }

  async function joinFromPending(inv: PendingGroupInviteDto) {
    if (!accessToken) return;
    setInviteActionErr(null);
    try {
      await apiJson<GroupDto>("/api/groups/join", {
        method: "POST",
        accessToken,
        json: { inviteToken: inv.inviteToken },
      });
      await Promise.all([load(), loadInvites()]);
      router.push(`/groups/${inv.groupId}`);
    } catch (e) {
      setInviteActionErr(apiErrorMessage(e));
    }
  }

  async function dismissPendingInvite(notificationId: string) {
    if (!accessToken) return;
    setInviteActionErr(null);
    try {
      await apiJson(`/api/groups/pending-invites/${notificationId}`, {
        method: "DELETE",
        accessToken,
      });
      await loadInvites();
    } catch (e) {
      setInviteActionErr(apiErrorMessage(e));
    }
  }

  async function createGroup(e: React.FormEvent) {
    e.preventDefault();
    if (!accessToken) return;
    setErr(null);
    try {
      await apiJson<GroupDto>("/api/groups", {
        method: "POST",
        accessToken,
        json: { name, defaultCurrency: 0 },
      });
      setName("");
      await load();
    } catch (e) {
      setErr(apiErrorMessage(e));
    }
  }

  if (!emailConfirmed) {
    return (
      <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-lg font-body-md text-on-surface-variant">
        {t("Confirm your email to create and list groups.")}
      </div>
    );
  }

  return (
    <div className="space-y-xl max-w-5xl">
      <div>
        <h2 className="font-display-lg text-display-lg text-primary">
          {t("Groups")}
        </h2>
        <p className="font-body-md text-body-md text-on-surface-variant mt-xs">
          {t(
            "Shareable groups with invite tokens — matches the settlements and expense flows in the design reference.",
          )}
        </p>
      </div>

      {err && (
        <div className="rounded-lg bg-error-container/40 text-error px-md py-sm font-body-md">
          {err}
        </div>
      )}

      {shareHint && (
        <div className="rounded-lg bg-secondary-fixed/50 text-primary px-md py-sm font-body-md border border-outline-variant/60">
          {shareHint}
        </div>
      )}

      {autoJoining && (
        <div className="rounded-lg border border-secondary/30 bg-secondary-fixed/30 px-md py-sm font-body-md text-on-surface">
          {t("Joining group…")}
        </div>
      )}

      {(inviteActionErr || invitesLoading) && (
        <div
          className={`rounded-xl border px-md py-sm font-body-md ${
            inviteActionErr
              ? "border-error/40 bg-error-container/30 text-error"
              : "border-outline-variant bg-surface-container-low text-on-surface-variant"
          }`}
        >
          {inviteActionErr ?? t("Loading invitations…")}
        </div>
      )}

      {!invitesLoading && pendingInvites.length > 0 ? (
        <section
          className="rounded-xl border border-secondary/35 bg-secondary-fixed/20 p-lg shadow-level-1 space-y-md"
          aria-label={t("Pending group invitations")}
        >
          <h3 className="font-headline-md text-headline-md text-on-surface">
            {t("Group invitations")}
          </h3>
          <ul className="space-y-md">
            {pendingInvites.map((inv) => (
              <li
                key={inv.notificationId}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-md rounded-lg border border-outline-variant/60 bg-surface p-md"
              >
                <div className="min-w-0">
                  <p className="font-body-md font-semibold text-on-surface">
                    {inv.groupName}
                  </p>
                  <p className="text-sm text-on-surface-variant mt-xs">
                    {t("From {name}", { name: inv.invitedByName })} ·{" "}
                    {new Date(inv.createdAt).toLocaleString(locale, {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </p>
                </div>
                <div className="flex flex-wrap gap-sm shrink-0">
                  <button
                    type="button"
                    onClick={() => void joinFromPending(inv)}
                    className="rounded-lg bg-secondary text-on-secondary font-label-sm px-md py-sm hover:bg-secondary/90"
                  >
                    {t("Join group")}
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      void dismissPendingInvite(inv.notificationId)
                    }
                    className="rounded-lg border border-outline-variant font-label-sm px-md py-sm text-primary hover:bg-surface-container-high"
                  >
                    {t("Dismiss")}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <form
        onSubmit={createGroup}
        className="bg-surface-container-lowest border border-outline-variant rounded-xl p-lg shadow-level-1 space-y-sm"
      >
        <label
          htmlFor="new-group-name"
          className="block font-label-sm text-label-sm text-on-surface-variant"
        >
          {t("New group name")}
        </label>
        <div className="flex flex-col sm:flex-row gap-md sm:items-stretch">
          <input
            id="new-group-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            minLength={2}
            className="flex-1 min-w-0 w-full bg-surface border border-outline-variant rounded-lg px-md py-sm font-body-md text-on-surface focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20"
            placeholder={t("Ski trip 2024")}
          />
          <button
            type="submit"
            className="shrink-0 box-border border border-transparent bg-secondary text-on-secondary font-body-md px-lg rounded-lg hover:bg-secondary/90 w-full sm:w-auto sm:min-w-[9.5rem] py-sm flex items-center justify-center"
          >
            {t("Create group")}
          </button>
        </div>
      </form>

      <form
        onSubmit={joinGroup}
        className="bg-surface-container-lowest border border-outline-variant rounded-xl p-lg shadow-level-1 space-y-sm"
      >
        <label
          htmlFor="join-invite"
          className="block font-label-sm text-label-sm text-on-surface-variant"
        >
          {t("Join with invite code")}
        </label>
        <p className="font-body-md text-body-md text-on-surface-variant -mt-xs">
          {t(
            "Paste the invite code (or open a shared link). Group UUID is not used here — only the invite token from the owner.",
          )}
        </p>
        <div className="flex flex-col sm:flex-row gap-md sm:items-stretch">
          <input
            id="join-invite"
            value={joinToken}
            onChange={(e) => setJoinToken(e.target.value)}
            className="flex-1 min-w-0 w-full bg-surface border border-outline-variant rounded-lg px-md py-sm font-body-md text-on-surface font-mono text-sm focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20"
            placeholder={t("Invite code from share link or group owner")}
            autoComplete="off"
            spellCheck={false}
          />
          <button
            type="submit"
            disabled={joinBusy || !joinToken.trim()}
            className="shrink-0 box-border border border-transparent bg-primary text-on-primary font-body-md px-lg rounded-lg hover:bg-primary-container disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto sm:min-w-[9.5rem] py-sm flex items-center justify-center gap-xs"
          >
            {joinBusy ? (
              t("Joining…")
            ) : (
              <>
                <span className="material-symbols-outlined text-[20px]">
                  login
                </span>
                {t("Join group")}
              </>
            )}
          </button>
        </div>
        {joinErr && (
          <div className="rounded-lg bg-error-container/40 text-error px-md py-sm font-body-md text-sm">
            {joinErr}
          </div>
        )}
      </form>

      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden shadow-level-1">
        <div className="px-lg py-sm bg-surface-container-low font-label-sm text-label-sm text-on-surface-variant border-b border-outline-variant">
          {t("Your groups")}
        </div>
        {loading ? (
          <div className="p-lg font-body-md text-on-surface-variant">
            {t("Loading…")}
          </div>
        ) : groups.length === 0 ? (
          <div className="p-lg font-body-md text-on-surface-variant">
            {t("No groups yet — create one above.")}
          </div>
        ) : (
          <ul className="divide-y divide-outline-variant/40">
            {groups.map((g) => (
              <li
                key={g.id}
                className="p-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-md"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-body-md text-body-md font-semibold text-on-surface">
                    {g.name}
                  </p>
                  <p className="font-label-sm text-label-sm text-on-surface-variant mt-xs">
                    {currencyCode(g.defaultCurrency)} · {t("Invite")}:{" "}
                    <code className="text-xs bg-surface-container-high px-1 rounded break-all">
                      {g.inviteToken}
                    </code>
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-sm shrink-0 w-full sm:w-auto">
                  <Link
                    href={`/groups/${g.id}`}
                    className="inline-flex items-center justify-center gap-xs rounded-lg border border-secondary bg-secondary text-on-secondary px-md py-sm font-label-sm text-label-sm hover:bg-secondary/90 transition-colors w-full sm:w-auto"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      arrow_forward
                    </span>
                    {t("Open group")}
                  </Link>
                  <InviteFriendToGroup
                    groupId={g.id}
                    groupName={g.name}
                    inviteToken={g.inviteToken}
                    accessToken={accessToken}
                    emailConfirmed={emailConfirmed}
                    apiErrorMessage={apiErrorMessage}
                    inviterName={profile?.name}
                  />
                  <button
                    type="button"
                    onClick={() => void shareGroup(g)}
                    className="inline-flex items-center justify-center gap-xs rounded-lg border border-outline-variant bg-surface px-md py-sm font-label-sm text-label-sm text-primary hover:bg-surface-container-high transition-colors w-full sm:w-auto"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      share
                    </span>
                    {t("Share invite")}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
