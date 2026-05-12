"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { apiJson } from "@/lib/api/client";
import type {
  GroupDetailDto,
  GroupMemberBalanceDto,
  GroupMemberSummaryDto,
  TransactionDto,
} from "@/lib/api/types";
import { currencyCode, currencyValueFromApi } from "@/lib/currency";
import { useAuth } from "@/lib/auth/auth-context";
import { InviteFriendToGroup } from "@/components/invite-friend-to-group";

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
  roster: GroupMemberSummaryDto[]
): string {
  if (selfId && paidByUserId === selfId) return "you";
  const row = roster.find((r) => r.userId === paidByUserId);
  return row?.displayName ?? `${paidByUserId.slice(0, 8)}…`;
}

export default function GroupDetailPage() {
  const params = useParams();
  const groupId = typeof params.groupId === "string" ? params.groupId : "";
  const { accessToken, emailConfirmed, profile, apiErrorMessage } = useAuth();

  const [detail, setDetail] = useState<GroupDetailDto | null>(null);
  const [balances, setBalances] = useState<GroupMemberBalanceDto[]>([]);
  const [transactions, setTransactions] = useState<TransactionDto[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [inviteCopied, setInviteCopied] = useState(false);
  const inviteCopyResetRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined
  );

  const balanceByUserId = useMemo(() => {
    const m = new Map<string, GroupMemberBalanceDto>();
    for (const b of balances) m.set(b.userId, b);
    return m;
  }, [balances]);

  const load = useCallback(async () => {
    if (!accessToken || !emailConfirmed || !groupId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setErr(null);
    try {
      const [dRaw, debts, txs] = await Promise.all([
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
      ]);
      setDetail(normalizeDetail(dRaw));
      setBalances(debts);
      setTransactions(txs);
    } catch (e) {
      setErr(apiErrorMessage(e));
      setDetail(null);
      setBalances([]);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  }, [accessToken, emailConfirmed, groupId, apiErrorMessage]);

  useEffect(() => {
    void load();
  }, [load]);

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

  const recentTx = useMemo(
    () => transactions.slice(0, 20),
    [transactions]
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
    <div className="space-y-xl max-w-5xl">
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
            <h2 className="font-display-lg text-display-lg text-primary">
              {detail.name}
            </h2>
            <p className="font-body-md text-body-md text-on-surface-variant">
              Member names come from the server. Balance columns use settlement /
              transaction totals when available.
            </p>
          </>
        ) : (
          <h2 className="font-display-lg text-display-lg text-primary">
            Group not found
          </h2>
        )}
      </div>

      {err && (
        <div className="rounded-lg bg-error-container/40 text-error px-md py-sm font-body-md">
          {err}
        </div>
      )}

      {detail && !loading && (
        <>
          <div className="grid gap-md md:grid-cols-2">
            <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-lg shadow-level-1 space-y-sm">
              <h3 className="font-headline-md text-headline-md text-on-surface border-b border-outline-variant pb-sm">
                Overview
              </h3>
              <dl className="space-y-sm font-body-md text-on-surface">
                <div className="flex justify-between gap-md">
                  <dt className="text-on-surface-variant">Default currency</dt>
                  <dd className="font-semibold">
                    {currencyCode(detail.defaultCurrency)}
                  </dd>
                </div>
                <div className="flex justify-between gap-md">
                  <dt className="text-on-surface-variant">Created by</dt>
                  <dd className="text-sm break-words text-right">
                    {profile?.id === detail.createdById
                      ? "You"
                      : detail.members.find((x) => x.userId === detail.createdById)
                          ?.displayName ?? detail.createdById}
                  </dd>
                </div>
                <div>
                  <dt className="text-on-surface-variant mb-xs">Invite code</dt>
                  <dd className="flex flex-col sm:flex-row gap-sm sm:items-stretch">
                    <code className="font-mono tabular-nums text-xs leading-5 tracking-normal bg-surface-container-high px-2 py-1 rounded break-all min-w-0 flex-1 text-on-surface">
                      {detail.inviteToken}
                    </code>
                    <button
                      type="button"
                      onClick={() => void copyInvite(detail.inviteToken)}
                      className={`shrink-0 rounded border px-2 py-1 font-mono tabular-nums text-xs leading-5 font-normal tracking-normal transition-colors min-w-[6.5rem] inline-flex items-center justify-center gap-1 self-start sm:self-stretch text-on-surface ${
                        inviteCopied
                          ? "border-secondary bg-secondary-fixed text-secondary"
                          : "border-outline-variant bg-surface text-primary hover:bg-surface-container-high"
                      }`}
                      aria-live="polite"
                    >
                      {inviteCopied ? (
                        <>
                          <span className="material-symbols-outlined text-[14px] leading-none shrink-0">
                            check
                          </span>
                          Copied
                        </>
                      ) : (
                        <>
                          <span className="material-symbols-outlined text-[14px] leading-none shrink-0">
                            content_copy
                          </span>
                          Copy
                        </>
                      )}
                    </button>
                  </dd>
                </div>
                <div className="pt-md border-t border-outline-variant/50">
                  <dt className="text-on-surface-variant mb-sm font-label-sm text-label-sm">
                    Invite a friend
                  </dt>
                  <dd>
                    <InviteFriendToGroup
                      groupName={detail.name}
                      inviteToken={detail.inviteToken}
                      accessToken={accessToken}
                      emailConfirmed={emailConfirmed}
                      apiErrorMessage={apiErrorMessage}
                      inviterName={profile?.name}
                    />
                  </dd>
                </div>
              </dl>
            </div>

            <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-lg shadow-level-1">
              <h3 className="font-headline-md text-headline-md text-on-surface border-b border-outline-variant pb-sm mb-md">
                Members ({detail.members.length})
              </h3>
              {detail.members.length === 0 ? (
                <p className="font-body-md text-on-surface-variant">
                  No members listed.
                </p>
              ) : (
                <ul className="divide-y divide-outline-variant/40 max-h-72 overflow-y-auto">
                  {detail.members.map((m) => {
                    const b = balanceByUserId.get(m.userId);
                    return (
                      <li
                        key={m.userId}
                        className="py-sm flex flex-col gap-xs font-body-md"
                      >
                        <div className="flex flex-wrap justify-between gap-md items-baseline">
                          <div>
                            <span className="font-semibold text-on-surface">
                              {rosterLabel(m, profile?.id)}
                            </span>
                            {m.isCreator ? (
                              <span className="ml-sm text-xs font-label-sm uppercase tracking-wider text-secondary">
                                Creator
                              </span>
                            ) : null}
                          </div>
                          <span className="text-on-surface-variant text-xs">
                            Joined{" "}
                            {new Date(m.joinedAt).toLocaleDateString(undefined, {
                              dateStyle: "medium",
                            })}
                          </span>
                        </div>
                        {profile?.id && m.userId !== profile.id ? (
                          <Link
                            href="/friends"
                            className="text-xs font-label-sm text-secondary hover:underline w-fit"
                          >
                            Friend request
                          </Link>
                        ) : null}
                        {b ? (
                          <div className="grid grid-cols-3 gap-xs text-xs text-on-surface-variant tabular-nums">
                            <span>
                              Owed:{" "}
                              <span className="text-on-surface font-medium">
                                {b.totalOwed.toFixed(2)}
                              </span>
                            </span>
                            <span>
                              Settled:{" "}
                              <span className="text-on-surface font-medium">
                                {b.settledAmount.toFixed(2)}
                              </span>
                            </span>
                            <span>
                              Remaining:{" "}
                              <span className="text-on-surface font-medium">
                                {b.remainingOwed.toFixed(2)}
                              </span>
                            </span>
                          </div>
                        ) : (
                          <p className="text-xs text-on-surface-variant">
                            No balance row yet (no shared expenses recorded).
                          </p>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-outline-variant bg-surface-container-lowest overflow-hidden shadow-level-1">
            <div className="px-lg py-sm bg-surface-container-low font-label-sm text-label-sm text-on-surface-variant border-b border-outline-variant">
              Recent transactions (up to 20)
            </div>
            {recentTx.length === 0 ? (
              <div className="p-lg font-body-md text-on-surface-variant">
                No transactions in this group yet.
              </div>
            ) : (
              <ul className="divide-y divide-outline-variant/40">
                {recentTx.map((t) => (
                  <li
                    key={t.id}
                    className="p-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-sm"
                  >
                    <div className="min-w-0">
                      <p className="font-body-md font-semibold text-on-surface truncate">
                        {t.description || categoryLabel(t.category)}
                      </p>
                      <p className="font-label-sm text-on-surface-variant">
                        {categoryLabel(t.category)} · Paid by{" "}
                        {paidByLabel(t.paidByUserId, profile?.id, detail.members)}{" "}
                        ·{" "}
                        {new Date(t.createdAt).toLocaleString(undefined, {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </p>
                    </div>
                    <p className="font-financial-xl text-[18px] text-on-surface shrink-0">
                      {currencyCode(t.currency)} {t.totalAmount.toFixed(2)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}
