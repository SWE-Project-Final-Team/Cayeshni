"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { GroupBalanceFlowGraph } from "@/components/group-detail/group-balance-flow-graph";
import { TransactionDetailPanel } from "@/components/group-detail/transaction-detail-panel";
import { TransactionSplitGraph } from "@/components/group-detail/transaction-split-graph";
import { InviteFriendToGroup } from "@/components/invite-friend-to-group";
import { owedAmountClass, oweAmountClass } from "@/lib/balance-tone";
import { apiJson, mediaUrl } from "@/lib/api/client";
import type {
  FriendDto,
  GroupDetailDto,
  GroupMemberBalanceDto,
  GroupMemberSummaryDto,
  PendingFriendRequestDto,
  SettlementDto,
  TransactionDetailDto,
  TransactionDto,
} from "@/lib/api/types";
import { currencyCode, currencyValueFromApi } from "@/lib/currency";
import {
  computeMemberNetBalances,
  simplifyToTransferEdges,
} from "@/lib/group-net-balances";
import { useAuth } from "@/lib/auth/auth-context";

const CATEGORY_LABELS: Record<number, string> = {
  0: "Transport",
  1: "Food",
  2: "Accommodation",
  3: "Entertainment",
  4: "Utilities",
  5: "Shopping",
  6: "Other",
};

function categoryLabel(c: number): string {
  return CATEGORY_LABELS[c] ?? `Category ${c}`;
}

function normalizeDetail(
  d: GroupDetailDto & { defaultCurrency?: string | number }
): GroupDetailDto {
  return {
    ...d,
    defaultCurrency: currencyValueFromApi(d.defaultCurrency),
  };
}

function rosterLabel(m: GroupMemberSummaryDto, selfId: string | undefined): string {
  if (selfId && m.userId === selfId) return "You";
  return m.displayName;
}

function paidByLabel(
  paidByUserId: string,
  selfId: string | undefined,
  roster: GroupMemberSummaryDto[],
  paidByDisplayName?: string
): string {
  if (selfId && paidByUserId === selfId) return "you";
  const row = roster.find((r) => r.userId === paidByUserId);
  if (row?.displayName) return row.displayName;
  const fromApi = paidByDisplayName?.trim();
  if (fromApi) return fromApi;
  return "Member";
}

function RosterAvatar({
  members,
  userId,
  className = "h-10 w-10",
}: {
  members: GroupMemberSummaryDto[];
  userId: string;
  className?: string;
}) {
  const m = members.find((x) => x.userId === userId);
  const src = mediaUrl(m?.profilePictureUrl ?? undefined);
  const initials = (m?.displayName ?? "?").slice(0, 2).toUpperCase();
  return (
    <div
      className={`relative shrink-0 rounded-full overflow-hidden border-2 border-outline-variant/80 bg-primary-fixed ${className}`}
      aria-hidden
    >
      <span className="absolute inset-0 flex items-center justify-center text-[11px] font-bold text-on-surface">
        {initials}
      </span>
      {src ? (
        <img
          src={src}
          alt=""
          className="relative z-10 h-full w-full object-cover"
          onError={(e) => {
            e.currentTarget.classList.add("hidden");
          }}
        />
      ) : null}
    </div>
  );
}

export default function GroupDetailPage() {
  const params = useParams();
  const groupId = typeof params.groupId === "string" ? params.groupId : "";
  const { accessToken, emailConfirmed, profile, apiErrorMessage } = useAuth();

  const [detail, setDetail] = useState<GroupDetailDto | null>(null);
  const [balances, setBalances] = useState<GroupMemberBalanceDto[]>([]);
  const [transactions, setTransactions] = useState<TransactionDto[]>([]);
  const [settlements, setSettlements] = useState<SettlementDto[]>([]);
  const [friends, setFriends] = useState<FriendDto[]>([]);
  const [pendingIncoming, setPendingIncoming] = useState<PendingFriendRequestDto[]>([]);
  const [outgoingFriendRequestIds, setOutgoingFriendRequestIds] = useState<
    ReadonlySet<string>
  >(() => new Set());
  const [friendActionUserId, setFriendActionUserId] = useState<string | null>(null);
  const [friendActionErr, setFriendActionErr] = useState<string | null>(null);
  const [selectedTxId, setSelectedTxId] = useState<string | null>(null);
  const [txDetail, setTxDetail] = useState<TransactionDetailDto | null>(null);
  const [txDetailLoading, setTxDetailLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [inviteCopied, setInviteCopied] = useState(false);
  const inviteCopyResetRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined
  );
  const selectedRowRef = useRef<HTMLLIElement | null>(null);
  const [graphMode, setGraphMode] = useState<"expense" | "group">("expense");
  const [balanceFocusUserId, setBalanceFocusUserId] = useState<string | null>(null);

  const balanceByUserId = useMemo(() => {
    const m = new Map<string, GroupMemberBalanceDto>();
    for (const b of balances) m.set(b.userId, b);
    return m;
  }, [balances]);

  const sortedTransactions = useMemo(() => {
    return [...transactions].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [transactions]);

  const selectedListRow = useMemo(
    () => sortedTransactions.find((t) => t.id === selectedTxId) ?? null,
    [sortedTransactions, selectedTxId]
  );

  const settlementsTouching = useMemo(() => {
    if (!selectedTxId) return [];
    return settlements.filter((s) =>
      s.allocations.some((a) => a.transactionId === selectedTxId)
    );
  }, [settlements, selectedTxId]);

  const graphMembers = useMemo(
    () =>
      (detail?.members ?? []).map((m) => ({
        userId: m.userId,
        displayName: rosterLabel(m, profile?.id),
        avatarUrl: mediaUrl(m.profilePictureUrl ?? undefined),
      })),
    [detail?.members, profile?.id]
  );

  const graphSplits = useMemo(() => {
    if (!selectedListRow) return [];
    if (txDetail?.members?.length) {
      return txDetail.members.map((m) => ({
        userId: m.userId,
        amountOwed: m.remainingOwed,
      }));
    }
    return selectedListRow.members.map((m) => ({
      userId: m.userId,
      amountOwed: m.amountOwed,
    }));
  }, [selectedListRow, txDetail]);

  const payerShareForGraph = useMemo(() => {
    if (!selectedListRow || !txDetail?.members?.length) return null;
    const row = txDetail.members.find((m) => m.userId === selectedListRow.paidByUserId);
    return row?.totalOwed ?? null;
  }, [selectedListRow, txDetail]);

  const graphCurrencyLabel = useMemo(() => {
    if (!detail) return "";
    const cur = txDetail
      ? currencyValueFromApi(txDetail.currency)
      : selectedListRow?.currency ?? detail.defaultCurrency;
    return currencyCode(cur);
  }, [detail, selectedListRow, txDetail]);

  const groupCurrencyLabel = useMemo(
    () => (detail ? currencyCode(detail.defaultCurrency) : ""),
    [detail]
  );

  const memberIdsOrdered = useMemo(
    () => (detail?.members ?? []).map((m) => m.userId),
    [detail?.members]
  );

  const netByMember = useMemo(() => {
    if (!detail) return new Map<string, number>();
    return computeMemberNetBalances(memberIdsOrdered, transactions, settlements);
  }, [detail, memberIdsOrdered, transactions, settlements]);

  const globalTransferEdges = useMemo(
    () => simplifyToTransferEdges(netByMember),
    [netByMember]
  );

  const friendIds = useMemo(
    () => new Set(friends.map((f) => f.userId)),
    [friends]
  );
  const pendingRequesterIds = useMemo(
    () => new Set(pendingIncoming.map((p) => p.userId)),
    [pendingIncoming]
  );

  const load = useCallback(async () => {
    if (!accessToken || !emailConfirmed || !groupId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setErr(null);
    try {
      const [dRaw, debts, txs, stl, fr, pend] = await Promise.all([
        apiJson<GroupDetailDto & { defaultCurrency?: string | number }>(
          `/api/groups/${groupId}`,
          { accessToken }
        ),
        apiJson<GroupMemberBalanceDto[]>(
          `/api/transactions/group/${groupId}/debts`,
          { accessToken }
        ).catch(() => [] as GroupMemberBalanceDto[]),
        apiJson<TransactionDto[]>(`/api/transactions/group/${groupId}`, {
          accessToken,
        }).catch(() => [] as TransactionDto[]),
        apiJson<SettlementDto[]>(`/api/settlements/${groupId}`, {
          accessToken,
        }).catch(() => [] as SettlementDto[]),
        apiJson<FriendDto[]>("/api/friends", { accessToken }).catch(
          () => [] as FriendDto[]
        ),
        apiJson<PendingFriendRequestDto[]>("/api/friends/pending", {
          accessToken,
        }).catch(() => [] as PendingFriendRequestDto[]),
      ]);
      setDetail(normalizeDetail(dRaw));
      setBalances(debts);
      setTransactions(txs);
      setSettlements(stl);
      setFriends(fr ?? []);
      setPendingIncoming(pend ?? []);
    } catch (e) {
      setErr(apiErrorMessage(e));
      setDetail(null);
      setBalances([]);
      setTransactions([]);
      setSettlements([]);
      setFriends([]);
      setPendingIncoming([]);
    } finally {
      setLoading(false);
    }
  }, [accessToken, emailConfirmed, groupId, apiErrorMessage]);

  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === "visible" && accessToken && emailConfirmed && groupId) {
        void load();
      }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [load, accessToken, emailConfirmed, groupId]);

  const refreshFriends = useCallback(async () => {
    if (!accessToken || !emailConfirmed) return;
    try {
      const [fr, pend] = await Promise.all([
        apiJson<FriendDto[]>("/api/friends", { accessToken }),
        apiJson<PendingFriendRequestDto[]>("/api/friends/pending", {
          accessToken,
        }),
      ]);
      setFriends(fr ?? []);
      setPendingIncoming(pend ?? []);
    } catch {
      /* ignore */
    }
  }, [accessToken, emailConfirmed]);

  useEffect(() => {
    setOutgoingFriendRequestIds((prev) => {
      const next = new Set(prev);
      for (const f of friends) next.delete(f.userId);
      return next;
    });
  }, [friends]);

  async function sendFriendRequestTo(targetUserId: string) {
    if (!accessToken) return;
    setFriendActionErr(null);
    setFriendActionUserId(targetUserId);
    try {
      await apiJson("/api/friends/request", {
        method: "POST",
        accessToken,
        json: { targetUserId, targetEmail: null },
      });
      setOutgoingFriendRequestIds((s) => new Set(s).add(targetUserId));
      await refreshFriends();
      setFriendActionErr(null);
    } catch (e) {
      const msg = apiErrorMessage(e);
      setFriendActionErr(msg);
      if (/already exists|already pending|friendship/i.test(msg)) {
        setOutgoingFriendRequestIds((s) => new Set(s).add(targetUserId));
      }
    } finally {
      setFriendActionUserId(null);
    }
  }

  async function acceptFriendRequestFrom(requesterId: string) {
    if (!accessToken) return;
    setFriendActionErr(null);
    setFriendActionUserId(requesterId);
    try {
      await apiJson(`/api/friends/accept/${requesterId}`, {
        method: "POST",
        accessToken,
      });
      await refreshFriends();
      setFriendActionErr(null);
    } catch (e) {
      setFriendActionErr(apiErrorMessage(e));
    } finally {
      setFriendActionUserId(null);
    }
  }

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    setSelectedTxId(null);
    setTxDetail(null);
    setOutgoingFriendRequestIds(new Set());
    setFriendActionErr(null);
  }, [groupId]);

  useEffect(() => {
    if (sortedTransactions.length === 0) {
      setSelectedTxId(null);
      return;
    }
    setSelectedTxId((prev) => {
      if (prev && sortedTransactions.some((t) => t.id === prev)) return prev;
      return sortedTransactions[0].id;
    });
  }, [sortedTransactions]);

  useEffect(() => {
    if (!selectedTxId || !accessToken || !emailConfirmed) {
      setTxDetail(null);
      setTxDetailLoading(false);
      return;
    }
    let cancelled = false;
    setTxDetailLoading(true);
    setTxDetail(null);
    void apiJson<TransactionDetailDto>(`/api/transactions/${selectedTxId}`, {
      accessToken,
    })
      .then((d) => {
        if (!cancelled && d.id === selectedTxId) setTxDetail(d);
      })
      .catch(() => {
        if (!cancelled) setTxDetail(null);
      })
      .finally(() => {
        if (!cancelled) setTxDetailLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedTxId, accessToken, emailConfirmed]);

  useEffect(() => {
    if (!selectedTxId) return;
    const t = window.requestAnimationFrame(() => {
      selectedRowRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    });
    return () => window.cancelAnimationFrame(t);
  }, [selectedTxId]);

  useEffect(() => {
    setInviteCopied(false);
    if (inviteCopyResetRef.current) {
      clearTimeout(inviteCopyResetRef.current);
      inviteCopyResetRef.current = undefined;
    }
  }, [detail?.inviteToken]);

  useEffect(
    () => () => {
      if (inviteCopyResetRef.current) clearTimeout(inviteCopyResetRef.current);
    },
    []
  );

  async function copyInvite(token: string) {
    try {
      await navigator.clipboard.writeText(token);
      if (inviteCopyResetRef.current) {
        clearTimeout(inviteCopyResetRef.current);
      }
      setInviteCopied(true);
      inviteCopyResetRef.current = setTimeout(() => {
        setInviteCopied(false);
        inviteCopyResetRef.current = undefined;
      }, 2000);
    } catch {
      /* ignore */
    }
  }

  if (!emailConfirmed) {
    return (
      <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-lg font-body-md text-on-surface-variant">
        Confirm your email to view group details.
      </div>
    );
  }

  return (
    <div className="space-y-xl max-w-[120rem]">
      <div className="flex flex-col gap-sm">
        <Link
          href="/groups"
          className="font-label-sm text-label-sm text-secondary hover:underline w-fit inline-flex items-center gap-xs"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          All groups
        </Link>
        {loading ? (
          <p className="font-body-md text-on-surface-variant">Loading…</p>
        ) : detail ? (
          <>
            <h2 className="font-display-lg text-display-lg text-primary">{detail.name}</h2>
            <p className="font-body-md text-body-md text-on-surface-variant max-w-3xl">
              Pick an expense, inspect the split map, or open the whole-group balance view to
              see who should pay whom after every transaction and settlement.
            </p>
          </>
        ) : (
          <h2 className="font-display-lg text-display-lg text-primary">Group not found</h2>
        )}
      </div>

      {err && (
        <div className="rounded-lg bg-error-container/40 text-error px-md py-sm font-body-md">
          {err}
        </div>
      )}

      {detail && !loading && (
        <>
          <section
            className="rounded-2xl border border-outline-variant/80 bg-surface-container-lowest overflow-hidden shadow-level-2"
            aria-labelledby="group-overview-heading"
          >
            <div className="px-lg py-lg sm:px-xl sm:py-xl bg-gradient-to-br from-secondary-fixed/30 via-surface-container-low to-primary-fixed/25 border-b border-outline-variant/50">
              <h2
                id="group-overview-heading"
                className="font-headline-md text-headline-md text-on-surface"
              >
                Overview & members
              </h2>
              <p className="font-body-md text-on-surface-variant mt-xs max-w-2xl">
                Invite people, track shares and settlements, and jump to the group balance map
                from a member card.
              </p>
              <div className="flex flex-wrap gap-sm mt-md">
                <span className="inline-flex items-center gap-xs rounded-full border border-outline-variant/80 bg-surface/90 px-md py-xs font-label-sm text-on-surface tabular-nums">
                  <span className="material-symbols-outlined text-[18px] text-secondary">group</span>
                  {detail.members.length} member{detail.members.length === 1 ? "" : "s"}
                </span>
                <span className="inline-flex items-center gap-xs rounded-full border border-outline-variant/80 bg-surface/90 px-md py-xs font-label-sm text-on-surface tabular-nums">
                  <span className="material-symbols-outlined text-[18px] text-secondary">
                    receipt_long
                  </span>
                  {sortedTransactions.length} expense
                  {sortedTransactions.length === 1 ? "" : "s"}
                </span>
                <span className="inline-flex items-center gap-xs rounded-full border border-outline-variant/80 bg-surface/90 px-md py-xs font-label-sm text-on-surface tabular-nums">
                  <span className="material-symbols-outlined text-[18px] text-secondary">payments</span>
                  {settlements.length} settlement{settlements.length === 1 ? "" : "s"}
                </span>
                <span className="inline-flex items-center gap-xs rounded-full border border-outline-variant/80 bg-surface/90 px-md py-xs font-label-sm text-on-surface tabular-nums">
                  <span className="material-symbols-outlined text-[18px] text-secondary">
                    account_balance
                  </span>
                  {groupCurrencyLabel}
                </span>
              </div>
            </div>

            <div className="p-lg sm:p-xl grid gap-xl lg:grid-cols-12 lg:gap-2xl">
              <div className="lg:col-span-5 space-y-lg">
                <dl className="space-y-md font-body-md text-on-surface">
                  <div className="flex justify-between gap-md items-baseline">
                    <dt className="text-on-surface-variant font-label-sm">Default currency</dt>
                    <dd className="font-semibold tabular-nums">{groupCurrencyLabel}</dd>
                  </div>
                  <div className="flex justify-between gap-md items-baseline">
                    <dt className="text-on-surface-variant font-label-sm">Created by</dt>
                    <dd className="text-sm font-medium text-right break-words max-w-[60%]">
                      {profile?.id === detail.createdById
                        ? "You"
                        : detail.members.find((x) => x.userId === detail.createdById)
                            ?.displayName ?? "—"}
                    </dd>
                  </div>
                  <div className="rounded-xl border border-outline-variant/60 bg-surface p-md space-y-sm">
                    <dt className="text-on-surface-variant font-label-sm mb-xs">Invite code</dt>
                    <dd className="flex flex-col sm:flex-row gap-sm sm:items-stretch">
                      <code className="font-mono tabular-nums text-xs leading-5 tracking-normal bg-surface-container-high px-2 py-1.5 rounded-lg break-all min-w-0 flex-1 text-on-surface">
                        {detail.inviteToken}
                      </code>
                      <button
                        type="button"
                        onClick={() => void copyInvite(detail.inviteToken)}
                        className={`shrink-0 rounded-lg border px-3 py-1.5 font-label-sm transition-colors min-w-[6.5rem] inline-flex items-center justify-center gap-1 self-start sm:self-stretch ${
                          inviteCopied
                            ? "border-secondary bg-secondary-fixed text-secondary"
                            : "border-outline-variant bg-surface-container-high text-primary hover:bg-surface-container-highest"
                        }`}
                        aria-live="polite"
                      >
                        {inviteCopied ? (
                          <>
                            <span className="material-symbols-outlined text-[16px]">check</span>
                            Copied
                          </>
                        ) : (
                          <>
                            <span className="material-symbols-outlined text-[16px]">content_copy</span>
                            Copy
                          </>
                        )}
                      </button>
                    </dd>
                  </div>
                </dl>
                <div className="rounded-xl border border-outline-variant/50 bg-surface-container-high/40 p-md">
                  <p className="font-label-sm text-on-surface-variant mb-sm">Invite a friend</p>
                  <InviteFriendToGroup
                    groupName={detail.name}
                    inviteToken={detail.inviteToken}
                    accessToken={accessToken}
                    emailConfirmed={emailConfirmed}
                    apiErrorMessage={apiErrorMessage}
                    inviterName={profile?.name}
                  />
                </div>
              </div>

              <div className="lg:col-span-7 min-w-0">
                <div className="flex items-end justify-between gap-md flex-wrap mb-md">
                  <h3 className="font-headline-sm text-on-surface">Members</h3>
                  <p className="text-xs text-on-surface-variant">
                    Tap a card to open the group balance map with that person highlighted
                  </p>
                </div>
                {detail.members.length === 0 ? (
                  <p className="font-body-md text-on-surface-variant">No members listed.</p>
                ) : (
                  <>
                    {friendActionErr ? (
                      <p className="text-xs text-error font-body-md mb-md" role="alert">
                        {friendActionErr}
                      </p>
                    ) : null}
                    <div className="grid sm:grid-cols-2 gap-md max-h-[min(70vh,32rem)] overflow-y-auto pr-xs">
                      {detail.members.map((m) => {
                        const b = balanceByUserId.get(m.userId);
                        const isSelf = profile?.id === m.userId;
                        const isFriend = friendIds.has(m.userId);
                        const hasIncomingRequest = pendingRequesterIds.has(m.userId);
                        const requestSent = outgoingFriendRequestIds.has(m.userId);
                        const busyThis = friendActionUserId === m.userId;
                        const net = netByMember.get(m.userId) ?? 0;
                        const netRounded = Math.round(net * 100) / 100;
                        const selectedCard = balanceFocusUserId === m.userId;
                        return (
                          <button
                            key={m.userId}
                            type="button"
                            onClick={() => {
                              setGraphMode("group");
                              setBalanceFocusUserId((prev) =>
                                prev === m.userId ? null : m.userId
                              );
                            }}
                            className={`text-left rounded-2xl border p-md flex flex-col gap-sm transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary ${
                              selectedCard
                                ? "border-secondary bg-secondary-fixed/25 ring-1 ring-secondary/35 shadow-level-1"
                                : "border-outline-variant/70 bg-surface hover:border-secondary/40 hover:bg-surface-container-high/50"
                            }`}
                          >
                            <div className="flex items-start gap-md">
                              <RosterAvatar
                                members={detail.members}
                                userId={m.userId}
                                className="h-12 w-12 shrink-0"
                              />
                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-baseline gap-x-sm gap-y-xs">
                                  <span className="font-semibold text-on-surface truncate">
                                    {rosterLabel(m, profile?.id)}
                                  </span>
                                  {m.isCreator ? (
                                    <span className="text-[10px] font-label-sm uppercase tracking-wider text-secondary shrink-0">
                                      Creator
                                    </span>
                                  ) : null}
                                </div>
                                <p className="text-xs text-on-surface-variant mt-px">
                                  Joined{" "}
                                  {new Date(m.joinedAt).toLocaleDateString(undefined, {
                                    dateStyle: "medium",
                                  })}
                                </p>
                              </div>
                            </div>
                            <div className="rounded-lg bg-surface-container-low/80 px-sm py-xs text-xs tabular-nums">
                              <span className="text-on-surface-variant">Net in group: </span>
                              {Math.abs(netRounded) < 0.01 ? (
                                <span className="font-semibold text-on-surface">Even</span>
                              ) : netRounded > 0 ? (
                                <span className={`font-semibold ${owedAmountClass(netRounded)}`}>
                                  +{groupCurrencyLabel} {netRounded.toFixed(2)} (owed to them)
                                </span>
                              ) : (
                                <span className={`font-semibold ${oweAmountClass(-netRounded)}`}>
                                  {groupCurrencyLabel} {(-netRounded).toFixed(2)} (they owe)
                                </span>
                              )}
                            </div>
                            {b ? (
                              <div className="grid grid-cols-3 gap-xs text-[10px] text-on-surface-variant tabular-nums leading-tight border-t border-outline-variant/40 pt-sm">
                                <span>
                                  Share{" "}
                                  <span className={`block font-medium ${oweAmountClass(b.totalOwed)}`}>
                                    {b.totalOwed.toFixed(2)}
                                  </span>
                                </span>
                                <span>
                                  Settled
                                  <span className={`block font-medium ${owedAmountClass(b.settledAmount)}`}>
                                    {b.settledAmount.toFixed(2)}
                                  </span>
                                </span>
                                <span>
                                  Left
                                  <span className={`block font-medium ${oweAmountClass(b.remainingOwed)}`}>
                                    {b.remainingOwed.toFixed(2)}
                                  </span>
                                </span>
                              </div>
                            ) : (
                              <p className="text-[10px] text-on-surface-variant border-t border-outline-variant/40 pt-sm">
                                No expense splits recorded yet.
                              </p>
                            )}
                            {profile?.id && !isSelf ? (
                              <div className="flex flex-wrap items-center gap-sm pt-xs border-t border-outline-variant/30">
                                {isFriend ? (
                                  <span className="text-xs font-label-sm text-secondary">Friends</span>
                                ) : hasIncomingRequest ? (
                                  <button
                                    type="button"
                                    disabled={busyThis}
                                    onClick={(ev) => {
                                      ev.stopPropagation();
                                      void acceptFriendRequestFrom(m.userId);
                                    }}
                                    className="text-xs font-label-sm rounded-lg border border-secondary bg-secondary text-on-secondary px-md py-xs hover:opacity-90 disabled:opacity-50"
                                  >
                                    {busyThis ? "Accepting…" : "Accept request"}
                                  </button>
                                ) : requestSent ? (
                                  <span className="text-xs font-label-sm text-on-surface-variant">
                                    Request sent
                                  </span>
                                ) : (
                                  <button
                                    type="button"
                                    disabled={busyThis}
                                    onClick={(ev) => {
                                      ev.stopPropagation();
                                      setFriendActionErr(null);
                                      void sendFriendRequestTo(m.userId);
                                    }}
                                    className="text-xs font-label-sm text-secondary hover:underline disabled:opacity-50"
                                  >
                                    {busyThis ? "Sending…" : "Add friend"}
                                  </button>
                                )}
                              </div>
                            ) : null}
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            </div>
          </section>

          <section
            aria-label="Group transactions hub"
            className={
              graphMode === "group"
                ? "w-full rounded-2xl border border-outline-variant/80 bg-gradient-to-br from-surface-container-low via-surface-container-lowest to-surface-container-low p-md sm:p-lg xl:p-xl shadow-[0_4px_24px_rgba(0,0,0,0.06)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.25)] flex flex-col gap-lg min-h-0"
                : "w-full rounded-2xl border border-outline-variant/80 bg-gradient-to-br from-surface-container-low via-surface-container-lowest to-surface-container-low p-md sm:p-lg xl:p-xl shadow-[0_4px_24px_rgba(0,0,0,0.06)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.25)] flex flex-col gap-xl xl:grid xl:grid-cols-[minmax(260px,300px)_minmax(0,1fr)_minmax(300px,400px)] xl:items-start xl:gap-2xl"
            }
          >
            <div className="flex w-full min-w-0 flex-col gap-sm border-b border-outline-variant/50 pb-sm -mt-xs mb-xs xl:col-span-3">
              <div className="flex w-full min-w-0 flex-col gap-sm sm:flex-row sm:items-start sm:justify-between sm:gap-md">
                <div className="flex min-w-0 flex-1 items-start gap-sm">
                  <span className="material-symbols-outlined shrink-0 text-[28px] text-secondary">
                    hub
                  </span>
                  <div className="min-w-0 flex-1">
                    <h2 className="font-headline-md text-headline-md leading-tight text-on-surface">
                      Expense hub
                    </h2>
                    <p className="mt-px font-label-sm text-on-surface-variant text-pretty">
                      {graphMode === "group"
                        ? "Whole hub · map only (list & details hidden)"
                        : "List · maps · details"}
                    </p>
                  </div>
                </div>
                {graphMode === "group" ? (
                  <p className="w-full min-w-0 max-w-full text-pretty text-xs text-on-surface-variant sm:max-w-[20rem] sm:flex-none sm:text-right">
                    Use <span className="font-semibold text-on-surface">This expense</span> to show
                    the expense list and breakdown again.
                  </p>
                ) : null}
              </div>
            </div>

            <aside
              className={`order-1 xl:order-none min-h-0 flex flex-col gap-sm ${graphMode === "group" ? "hidden" : ""}`}
            >
              <h3 className="font-headline-sm text-headline-sm text-on-surface shrink-0 inline-flex items-center gap-xs">
                <span className="material-symbols-outlined text-[22px] text-on-surface-variant">
                  receipt_long
                </span>
                All expenses
              </h3>
              <p className="font-label-sm text-on-surface-variant shrink-0">
                {sortedTransactions.length} item
                {sortedTransactions.length === 1 ? "" : "s"} · newest first
              </p>
              {sortedTransactions.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-outline-variant bg-surface-container-lowest/80 p-lg font-body-md text-on-surface-variant">
                  No transactions in this group yet.
                </div>
              ) : (
                <ul
                  className="rounded-2xl border border-outline-variant/90 bg-surface-container-lowest/95 divide-y divide-outline-variant/35 overflow-y-auto max-h-[70vh] xl:max-h-[min(78vh,52rem)] shadow-inner"
                  role="listbox"
                  aria-label="Transaction list"
                >
                  {sortedTransactions.map((t) => {
                    const selected = t.id === selectedTxId;
                    return (
                      <li key={t.id} ref={selected ? selectedRowRef : undefined}>
                        <button
                          type="button"
                          role="option"
                          aria-selected={selected}
                          onClick={() => {
                            setSelectedTxId(t.id);
                            setGraphMode("expense");
                          }}
                          className={`w-full text-left p-md flex gap-md transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary ${
                            selected
                              ? "bg-gradient-to-r from-secondary-fixed/45 to-secondary-fixed/10 ring-1 ring-inset ring-secondary/40"
                              : "hover:bg-surface-container-high/80"
                          }`}
                        >
                          <RosterAvatar members={detail.members} userId={t.paidByUserId} />
                          <div className="min-w-0 flex-1 flex flex-col gap-xs">
                            <div className="flex flex-col gap-px">
                              <div className="flex justify-between gap-md items-baseline">
                                <span className="font-label-sm text-label-sm text-on-surface-variant shrink-0">
                                  Description
                                </span>
                                <span className="font-financial-xl text-sm text-secondary shrink-0 tabular-nums">
                                  {currencyCode(t.currency)} {t.totalAmount.toFixed(2)}
                                </span>
                              </div>
                              <span className="font-body-md font-semibold text-on-surface truncate min-w-0">
                                {t.description?.trim() || "—"}
                              </span>
                            </div>
                            <div className="flex flex-wrap items-center gap-xs">
                              <span className="rounded-full bg-primary-fixed/35 text-on-surface px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
                                {categoryLabel(t.category)}
                              </span>
                              <span className="font-label-sm text-on-surface-variant">
                                Paid by{" "}
                                {paidByLabel(
                                  t.paidByUserId,
                                  profile?.id,
                                  detail.members,
                                  t.paidByDisplayName
                                )}
                              </span>
                            </div>
                            <span className="text-xs text-on-surface-variant tabular-nums">
                              {new Date(t.createdAt).toLocaleString(undefined, {
                                dateStyle: "medium",
                                timeStyle: "short",
                              })}
                            </span>
                          </div>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </aside>

            <div className="order-2 flex min-h-0 w-full min-w-0 flex-1 flex-col gap-sm xl:order-none">
              <div className="flex w-full min-w-0 flex-wrap items-center gap-sm">
                <span className="font-label-sm text-on-surface-variant uppercase tracking-wider shrink-0">
                  Center view
                </span>
                <div className="inline-flex rounded-full border border-outline-variant/80 bg-surface-container-high/60 p-0.5 gap-0.5">
                  <button
                    type="button"
                    onClick={() => setGraphMode("expense")}
                    className={`rounded-full px-md py-xs text-sm font-label-sm transition-colors ${
                      graphMode === "expense"
                        ? "bg-secondary text-on-secondary shadow-sm"
                        : "text-on-surface-variant hover:text-on-surface"
                    }`}
                  >
                    This expense
                  </button>
                  <button
                    type="button"
                    onClick={() => setGraphMode("group")}
                    className={`rounded-full px-md py-xs text-sm font-label-sm transition-colors ${
                      graphMode === "group"
                        ? "bg-secondary text-on-secondary shadow-sm"
                        : "text-on-surface-variant hover:text-on-surface"
                    }`}
                  >
                    Whole group
                  </button>
                </div>
              </div>

              {graphMode === "group" ? (
                <div className="flex min-h-[420px] w-full min-w-0 flex-1 flex-col sm:min-h-[480px] xl:min-h-[560px]">
                  <GroupBalanceFlowGraph
                    members={graphMembers}
                    edges={globalTransferEdges}
                    currencyLabel={groupCurrencyLabel}
                    focusUserId={balanceFocusUserId}
                    onFocusUser={setBalanceFocusUserId}
                  />
                </div>
              ) : selectedListRow ? (
                <TransactionSplitGraph
                  members={graphMembers}
                  paidByUserId={selectedListRow.paidByUserId}
                  splits={graphSplits}
                  currencyLabel={graphCurrencyLabel}
                  payerShareAmount={payerShareForGraph}
                />
              ) : (
                <div className="rounded-2xl border border-dashed border-outline-variant bg-surface-container-lowest/80 p-xl min-h-[300px] flex flex-col items-center justify-center text-on-surface-variant font-body-md text-center gap-sm">
                  <span className="material-symbols-outlined text-5xl opacity-40">account_tree</span>
                  <p>Select an expense for the per-receipt split map, or switch to Whole group.</p>
                </div>
              )}
            </div>

            <aside
              className={`order-3 xl:order-none xl:sticky xl:top-4 min-w-0 ${graphMode === "group" ? "hidden" : ""}`}
            >
              <TransactionDetailPanel
                listRow={selectedListRow}
                detail={txDetail}
                detailLoading={txDetailLoading}
                roster={detail.members}
                selfUserId={profile?.id}
                categoryDisplay={
                  selectedListRow ? categoryLabel(selectedListRow.category) : ""
                }
                settlementsTouching={settlementsTouching}
              />
            </aside>
          </section>
        </>
      )}
    </div>
  );
}
