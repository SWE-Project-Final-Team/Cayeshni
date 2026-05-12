"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { apiJson } from "@/lib/api/client";
import type { FriendDto } from "@/lib/api/types";
import { buildGroupJoinUrl } from "@/lib/group-invite";

type Props = {
  groupName: string;
  inviteToken: string;
  accessToken: string | null;
  emailConfirmed: boolean;
  apiErrorMessage: (e: unknown) => string;
  /** Your display name for the email body */
  inviterName?: string | null;
};

export function InviteFriendToGroup({
  groupName,
  inviteToken,
  accessToken,
  emailConfirmed,
  apiErrorMessage,
  inviterName,
}: Props) {
  const [open, setOpen] = useState(false);
  const [friends, setFriends] = useState<FriendDto[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);
  const [copyFailMessage, setCopyFailMessage] = useState<string | null>(null);
  const copyResetRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined
  );

  const loadFriends = useCallback(async () => {
    if (!accessToken || !emailConfirmed) return;
    setLoading(true);
    setErr(null);
    try {
      const data = await apiJson<FriendDto[]>("/api/friends", { accessToken });
      setFriends(data);
    } catch (e) {
      setErr(apiErrorMessage(e));
      setFriends([]);
    } finally {
      setLoading(false);
    }
  }, [accessToken, emailConfirmed, apiErrorMessage]);

  useEffect(() => {
    if (!open || friends !== null) return;
    void loadFriends();
  }, [open, friends, loadFriends]);

  function clearCopyResetTimer() {
    if (copyResetRef.current !== undefined) {
      clearTimeout(copyResetRef.current);
      copyResetRef.current = undefined;
    }
  }

  function close() {
    setOpen(false);
    setErr(null);
    setLinkCopied(false);
    setCopyFailMessage(null);
    clearCopyResetTimer();
  }

  function openModal() {
    setFriends(null);
    setErr(null);
    setLinkCopied(false);
    setCopyFailMessage(null);
    clearCopyResetTimer();
    setOpen(true);
  }

  const joinUrl = buildGroupJoinUrl(inviteToken);
  const fromLine = inviterName?.trim() ? inviterName.trim() : "A friend";

  function mailtoForFriend(friend: FriendDto) {
    const subject = encodeURIComponent(
      `Join “${groupName}” on Cayeshni`
    );
    const body = encodeURIComponent(
      `${fromLine} invited you to split expenses in “${groupName}” on Cayeshni.\n\nOpen this link to join (log in or sign up first):\n${joinUrl}\n\nOr in Cayeshni go to Groups → Join with invite code and paste:\n${inviteToken}\n`
    );
    const addr = encodeURIComponent(friend.email).replace(/%20/g, "");
    window.location.href = `mailto:${addr}?subject=${subject}&body=${body}`;
  }

  async function copyJoinLink() {
    setCopyFailMessage(null);
    clearCopyResetTimer();
    try {
      await navigator.clipboard.writeText(joinUrl);
      setLinkCopied(true);
    } catch {
      try {
        await navigator.clipboard.writeText(inviteToken);
        setLinkCopied(true);
      } catch {
        setLinkCopied(false);
        setCopyFailMessage(
          "Could not copy — select the invite code from the group."
        );
        return;
      }
    }
    copyResetRef.current = setTimeout(() => {
      setLinkCopied(false);
      copyResetRef.current = undefined;
    }, 2500);
  }

  async function shareLink() {
    setCopyFailMessage(null);
    const text = `${fromLine} invited you to “${groupName}” on Cayeshni.\n\n${joinUrl}\n\nInvite code: ${inviteToken}`;
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: `Join ${groupName} on Cayeshni`,
          text,
          url: joinUrl,
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
    await copyJoinLink();
  }

  useEffect(
    () => () => {
      clearCopyResetTimer();
    },
    []
  );

  if (!emailConfirmed) return null;

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        className="inline-flex items-center justify-center gap-xs rounded-lg border border-outline-variant bg-surface px-md py-sm font-label-sm text-label-sm text-primary hover:bg-surface-container-high transition-colors w-full sm:w-auto"
      >
        <span className="material-symbols-outlined text-[18px]">person_add</span>
        Invite friend
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-sm sm:p-md bg-inverse-surface/50"
          role="presentation"
          onClick={close}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="invite-friend-title"
            className="w-full max-w-5xl rounded-2xl border border-outline-variant bg-surface shadow-level-2 px-lg py-lg sm:px-xl sm:py-xl max-h-[min(90vh,920px)] overflow-y-auto mx-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start gap-md mb-md">
              <h3
                id="invite-friend-title"
                className="font-headline-md text-headline-md text-on-surface pr-md"
              >
                Invite a friend
              </h3>
              <button
                type="button"
                className="shrink-0 text-on-surface-variant hover:text-on-surface p-xs rounded-lg hover:bg-surface-container-high"
                aria-label="Close"
                onClick={close}
              >
                <span className="material-symbols-outlined text-[22px]">close</span>
              </button>
            </div>
            <p className="font-body-md text-on-surface-variant mb-md">
              <span className="font-semibold text-on-surface">{groupName}</span>{" "}
              — pick a friend to open an email with the join link, or copy / share
              the link yourself.
            </p>

            <div className="flex flex-col sm:flex-row gap-sm mb-lg">
              <button
                type="button"
                onClick={() => void copyJoinLink()}
                className={`flex-1 inline-flex items-center justify-center gap-xs rounded-lg border px-md py-sm font-label-sm transition-colors ${
                  linkCopied
                    ? "border-secondary bg-secondary-fixed text-secondary"
                    : "border-outline-variant bg-surface-container-lowest text-primary hover:bg-surface-container-high"
                }`}
              >
                {linkCopied ? (
                  <>
                    <span className="material-symbols-outlined text-[18px]">
                      check
                    </span>
                    Copied
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[18px]">
                      link
                    </span>
                    Copy join link
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => void shareLink()}
                className="flex-1 inline-flex items-center justify-center gap-xs rounded-lg border border-secondary bg-secondary text-on-secondary px-md py-sm font-label-sm hover:bg-secondary/90"
              >
                <span className="material-symbols-outlined text-[18px]">share</span>
                Share…
              </button>
            </div>
            {copyFailMessage ? (
              <p className="text-sm text-error mb-md font-body-md">
                {copyFailMessage}
              </p>
            ) : null}
            {err ? (
              <p className="text-sm text-error mb-md font-body-md">{err}</p>
            ) : null}

            <p className="font-label-sm text-label-sm text-on-surface-variant mb-sm">
              Your Cayeshni friends
            </p>
            {loading ? (
              <p className="font-body-md text-on-surface-variant py-md">Loading…</p>
            ) : friends && friends.length === 0 ? (
              <div className="rounded-lg border border-outline-variant/60 bg-surface-container-lowest p-md space-y-sm">
                <p className="font-body-md text-on-surface-variant">
                  You don&apos;t have friends on Cayeshni yet. Add friends first, or
                  use copy / share above.
                </p>
                <Link
                  href="/friends"
                  className="inline-flex font-label-sm text-secondary hover:underline"
                  onClick={close}
                >
                  Go to Friends
                </Link>
              </div>
            ) : (
              <ul className="divide-y divide-outline-variant/50 border border-outline-variant/60 rounded-lg overflow-hidden max-h-[min(50vh,22rem)] sm:max-h-72 overflow-y-auto">
                {friends?.map((f) => (
                  <li
                    key={f.userId}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-sm p-md bg-surface-container-lowest"
                  >
                    <div className="min-w-0">
                      <p className="font-body-md font-semibold text-on-surface truncate">
                        {f.name}
                      </p>
                      <p className="text-xs text-on-surface-variant truncate">
                        {f.email}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => mailtoForFriend(f)}
                      className="shrink-0 inline-flex items-center justify-center gap-xs rounded-lg border border-primary bg-primary text-on-primary px-md py-sm font-label-sm text-label-sm hover:bg-primary-container w-full sm:w-auto"
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        mail
                      </span>
                      Email invite
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}
