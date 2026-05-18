"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { apiJson } from "@/lib/api/client";
import type {
  GroupDetailDto,
  GroupDto,
  SettlementDto,
  TransactionDetailDto,
  TransactionDto,
} from "@/lib/api/types";
import { ListboxSelect } from "@/components/listbox-select";
import ErrorBoundary from "@/components/error-boundary";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { owedAmountClass, oweAmountClass } from "@/lib/balance-tone";
import { currencyApiName, currencyCode, currencyValueFromApi } from "@/lib/currency";
import { useAuth } from "@/lib/auth/auth-context";
import {
  buildAllocationsFifo,
  candidateTransactionIds,
  maxSettleableTowardPayee,
} from "@/lib/settlements/build-allocations";
import {
  computeMemberNetBalances,
  simplifyToTransferEdges,
} from "@/lib/group-net-balances";

function displayName(
  members: { userId: string; displayName: string }[] | undefined,
  userId: string
): string {
  const m = members?.find((x) => x.userId === userId);
  return m?.displayName ?? `${userId.slice(0, 8)}…`;
}

export default function SettlementsPage() {
  const {
    accessToken,
    emailConfirmed,
    profile,
    loadProfile,
    apiErrorMessage,
  } = useAuth();
  const [groups, setGroups] = useState<GroupDto[]>([]);
  const [groupId, setGroupId] = useState("");
  const [detail, setDetail] = useState<GroupDetailDto | null>(null);
  const [txs, setTxs] = useState<TransactionDto[]>([]);
  const [rows, setRows] = useState<SettlementDto[]>([]);
  const [err, setErr] = useState<string | null>(null);

  const [payeeUserId, setPayeeUserId] = useState("");
  const [amountStr, setAmountStr] = useState("");
  const [note, setNote] = useState("");
  const [formErr, setFormErr] = useState<string | null>(null);
  const [formPending, setFormPending] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [payeeDetails, setPayeeDetails] = useState<TransactionDetailDto[]>([]);

  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState("");
  const [notePending, setNotePending] = useState(false);

  const [settlementToDelete, setSettlementToDelete] = useState<SettlementDto | null>(
    null
  );
  const [deletePending, setDeletePending] = useState(false);
  const [visibleAllocationsBySettlement, setVisibleAllocationsBySettlement] =
    useState<Record<string, boolean>>({});

  const payerId = profile?.id ?? "";

  useEffect(() => {
    if (accessToken && emailConfirmed) void loadProfile();
  }, [accessToken, emailConfirmed, loadProfile]);

  const loadGroups = useCallback(async () => {
    if (!accessToken || !emailConfirmed) return;
    try {
      const data = await apiJson<GroupDto[]>("/api/groups", { accessToken });
      setGroups(data);
      setGroupId((prev) => prev || data[0]?.id || "");
    } catch (e) {
      setErr(apiErrorMessage(e));
    }
  }, [accessToken, emailConfirmed, apiErrorMessage]);

  const loadGroupContext = useCallback(async () => {
    if (!accessToken || !emailConfirmed || !groupId) {
      setDetail(null);
      setTxs([]);
      setRows([]);
      return;
    }
    setErr(null);
    try {
      const [d, t, s] = await Promise.all([
        apiJson<GroupDetailDto>(`/api/groups/${groupId}`, { accessToken }),
        apiJson<TransactionDto[]>(`/api/transactions/group/${groupId}`, {
          accessToken,
        }),
        apiJson<SettlementDto[]>(`/api/settlements/${groupId}`, { accessToken }),
      ]);
      setDetail(d);
      setTxs(t);
      setRows(s);
      setPayeeUserId("");
      setAmountStr("");
      setNote("");
      setFormErr(null);
    } catch (e) {
      setErr(apiErrorMessage(e));
      setDetail(null);
      setTxs([]);
      setRows([]);
    }
  }, [accessToken, emailConfirmed, groupId, apiErrorMessage]);

  const loadSettlementsOnly = useCallback(async () => {
    if (!accessToken || !emailConfirmed || !groupId) return;
    try {
      const s = await apiJson<SettlementDto[]>(`/api/settlements/${groupId}`, {
        accessToken,
      });
      setRows(s);
    } catch {
      /* keep list stale on silent refresh */
    }
  }, [accessToken, emailConfirmed, groupId]);

  useEffect(() => {
    void loadGroups();
  }, [loadGroups]);

  useEffect(() => {
    void loadGroupContext();
  }, [loadGroupContext]);

  useEffect(() => {
    if (!accessToken || !emailConfirmed || !groupId || !payerId) {
      setPayeeDetails([]);
      setPreviewLoading(false);
      return;
    }

    if (!payeeUserId || payeeUserId === payerId) {
      setPayeeDetails([]);
      setPreviewLoading(false);
      return;
    }

    const ids = candidateTransactionIds(txs, payerId, payeeUserId);
    if (ids.length === 0) {
      setPayeeDetails([]);
      setPreviewLoading(false);
      return;
    }

    let cancelled = false;
    setPreviewLoading(true);
    void (async () => {
      try {
        const details = await Promise.all(
          ids.map((id: string) =>
            apiJson<TransactionDetailDto>(`/api/transactions/${id}`, {
              accessToken,
            })
          )
        );
        if (!cancelled) setPayeeDetails(details);
      } catch (e) {
        if (!cancelled) setFormErr(apiErrorMessage(e));
      } finally {
        if (!cancelled) setPreviewLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [accessToken, emailConfirmed, groupId, payerId, payeeUserId, txs, apiErrorMessage]);

  const owedToMemberById = useMemo(() => {
    if (!detail) return new Map<string, number>();
    const memberIdsOrdered = detail.members.map((m) => m.userId);
    const netByMember = computeMemberNetBalances(memberIdsOrdered, txs, rows);
    const transferEdges = simplifyToTransferEdges(netByMember);
    const owed = new Map<string, number>();
    for (const edge of transferEdges) {
      if (edge.from === payerId) {
        owed.set(edge.to, edge.amount);
      }
    }
    return owed;
  }, [detail, payerId, rows, txs]);

  const balanceRows = useMemo(() => {
    if (!detail) return [];
    return (detail.members ?? [])
      .filter((m) => m.userId !== payerId)
      .map((m) => ({
        userId: m.userId,
        displayName: m.displayName,
        remainingOwed: owedToMemberById.get(m.userId) ?? 0,
      }))
      .filter((row) => row.remainingOwed > 0.005)
      .sort((a, b) => b.remainingOwed - a.remainingOwed);
  }, [detail, payerId, owedToMemberById]);

  const maxTowardPayee = useMemo(() => {
    if (!payeeUserId || payeeUserId === payerId) return 0;
    const remainingForThisPayee = owedToMemberById.get(payeeUserId) ?? 0;
    const detailedRemaining = maxSettleableTowardPayee(payeeDetails, payerId);
    return Math.min(remainingForThisPayee, detailedRemaining);
  }, [owedToMemberById, payeeDetails, payerId, payeeUserId]);

  const hasSelectedPayee = Boolean(payeeUserId && payeeUserId !== payerId);

  const previewAllocations = useMemo(() => {
    const n = Number.parseFloat(amountStr.replace(",", "."));
    if (!Number.isFinite(n) || n <= 0 || !payerId || payeeDetails.length === 0)
      return [];
    return buildAllocationsFifo(payeeDetails, payerId, n);
  }, [amountStr, payerId, payeeDetails]);

  const groupListboxOptions = useMemo(
    () => groups.map((g) => ({ value: g.id, label: g.name })),
    [groups]
  );

  const payeeListboxOptions = useMemo(() => {
    return (detail?.members ?? [])
      .filter((m) => m.userId !== payerId)
      .map((m) => ({
        value: m.userId,
        label: m.displayName,
        description: (() => {
          const owed = owedToMemberById.get(m.userId) ?? 0;
          return owed > 0.005
            ? `You still owe ${currencyCode(detail?.defaultCurrency ?? 0)} ${owed.toFixed(2)}`
            : "No remaining balance";
        })(),
      }))
        .filter((o) => (owedToMemberById.get(o.value) ?? 0) > 0.005)
        .sort((a, b) => (owedToMemberById.get(b.value) ?? 0) - (owedToMemberById.get(a.value) ?? 0));
  }, [detail?.members, detail?.defaultCurrency, owedToMemberById, payerId]);

  async function submitSettlement(e: React.FormEvent) {
    e.preventDefault();
    if (!accessToken || !payerId || !detail) return;
    setFormErr(null);
    const payee = payeeUserId.trim();
    if (!payee || payee === payerId) {
      setFormErr("Choose another member as payee.");
      return;
    }
    const amount = Number.parseFloat(amountStr.replace(",", "."));
    if (!Number.isFinite(amount) || amount <= 0) {
      setFormErr("Enter a positive amount.");
      return;
    }
    if (amount > maxTowardPayee + 0.005) {
      setFormErr(
        `Amount cannot exceed what you still owe this member on their shared expenses (${maxTowardPayee.toFixed(2)} ${currencyCode(detail.defaultCurrency)}).`
      );
      return;
    }
    const allocations = buildAllocationsFifo(payeeDetails, payerId, amount);
    if (allocations.length === 0) {
      setFormErr(
        "No matching expenses to apply this payment to. Pick a payee you owe through a shared expense they paid for."
      );
      return;
    }
    setFormPending(true);
    try {
      await apiJson("/api/settlements", {
        method: "POST",
        accessToken,
        json: {
          groupId: detail.id,
          payerUserId: payerId,
          payeeUserId: payee,
          amount,
          currency: currencyApiName(detail.defaultCurrency),
          note: note.trim() || null,
          allocations,
        },
      });
      setAmountStr("");
      setNote("");
      await loadGroupContext();
    } catch (e) {
      setFormErr(apiErrorMessage(e));
    } finally {
      setFormPending(false);
    }
  }

  async function deleteSettlementConfirmed() {
    const s = settlementToDelete;
    if (!accessToken || !s) return;
    setDeletePending(true);
    setErr(null);
    try {
      await apiJson("/api/settlements", {
        method: "DELETE",
        accessToken,
        json: {
          id: s.id,
          groupId: s.groupId,
          payerUserId: s.payerUserId,
          payeeUserId: s.payeeUserId,
          amount: s.amount,
          currency: s.currency,
          createdAt: s.createdAt,
          note: s.note,
          allocations: s.allocations,
        },
      });
      setSettlementToDelete(null);
      await loadGroupContext();
    } catch (e) {
      setErr(apiErrorMessage(e));
    } finally {
      setDeletePending(false);
    }
  }

  async function saveNote(s: SettlementDto) {
    if (!accessToken) return;
    setNotePending(true);
    setErr(null);
    try {
      await apiJson("/api/settlements", {
        method: "PUT",
        accessToken,
        json: {
          id: s.id,
          groupId: s.groupId,
          payerUserId: s.payerUserId,
          payeeUserId: s.payeeUserId,
          amount: s.amount,
          currency: s.currency,
          createdAt: s.createdAt,
          note: noteDraft.trim() || null,
          allocations: s.allocations,
        },
      });
      setEditingNoteId(null);
      await loadSettlementsOnly();
    } catch (e) {
      setErr(apiErrorMessage(e));
    } finally {
      setNotePending(false);
    }
  }

  if (!emailConfirmed) {
    return (
      <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-lg font-body-md text-on-surface-variant">
        Confirm your email to load settlements.
      </div>
    );
  }

  if (!payerId) {
    return (
      <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-lg font-body-md text-on-surface-variant">
        Loading your account…
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="space-y-xl max-w-5xl">
      <header className="border-b border-outline-variant pb-lg">
        <h1 className="font-display-lg text-display-lg text-primary">
          Settlements
        </h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant mt-xs">
          Record cash or external transfers against shared expenses. Allocations
          apply to the oldest matching expenses first.
        </p>
        <div className="mt-md flex flex-wrap gap-sm items-end">
          <div className="flex flex-col gap-xs min-w-[220px] max-w-full flex-1 sm:flex-initial sm:min-w-[260px]">
            <label className="font-label-sm text-on-surface-variant">Group</label>
            <ListboxSelect
              value={groupId}
              onChange={setGroupId}
              options={groupListboxOptions}
              placeholder="Choose a group"
              emptyMessage="No groups yet — create one under Groups"
              leadingIcon="groups"
              className="w-full"
              align="end"
            />
          </div>
        </div>
      </header>

      {err && (
        <div className="rounded-lg bg-error-container/40 text-error px-md py-sm font-body-md">
          {err}
        </div>
      )}

      {!groupId ? (
        <p className="font-body-md text-on-surface-variant">
          Join or create a group to use settlements.
        </p>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-lg">
          <div className="space-y-lg">
            <div className="bg-surface rounded-xl border border-outline-variant shadow-level-1 p-lg">
              <h2 className="font-headline-md text-headline-md text-primary mb-md">
                Members you still owe
              </h2>
              {detail == null ? (
                <p className="font-body-md text-on-surface-variant">Loading…</p>
              ) : balanceRows.length === 0 ? (
                <p className="font-body-md text-on-surface-variant">
                  No members you currently owe.
                </p>
              ) : (
                <ul className="divide-y divide-outline-variant/40 max-h-80 overflow-y-auto tabular-nums">
                  {balanceRows.map((b) => (
                    <li
                      key={b.userId}
                      className="py-sm flex flex-wrap justify-between gap-sm text-sm"
                    >
                      <span className="text-on-surface font-medium">
                        {b.displayName}
                      </span>
                      <span className="text-on-surface-variant">
                        Remaining owed:{" "}
                        <span className={`font-medium tabular-nums ${oweAmountClass(b.remainingOwed)}`}>
                          {b.remainingOwed.toFixed(2)}{" "}
                          {currencyCode(detail.defaultCurrency)}
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <form
              onSubmit={submitSettlement}
              className="bg-surface rounded-xl border border-outline-variant shadow-level-1 p-lg space-y-md"
            >
              <h2 className="font-headline-md text-headline-md text-primary">
                Record payment
              </h2>
              <p className="font-body-md text-on-surface-variant text-sm">
                Choose a member you still owe in this group. The payment will
                apply to your oldest unsettled expenses with that person.
              </p>
              {detail == null ? (
                <p className="text-sm text-on-surface-variant">Loading group…</p>
              ) : (
                <>
                  <div>
                    <label className="block font-label-sm text-label-sm text-on-surface-variant mb-xs">
                      Pay to
                    </label>
                    <ListboxSelect
                      value={payeeUserId}
                      onChange={setPayeeUserId}
                      options={payeeListboxOptions}
                      placeholder={
                        previewLoading
                          ? "Loading members…"
                          : payeeListboxOptions.length === 0
                            ? "No members you still owe"
                            : "Select member…"
                      }
                      emptyMessage="No members you still owe"
                      leadingIcon="person"
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block font-label-sm text-label-sm text-on-surface-variant mb-xs">
                      Amount ({currencyCode(detail.defaultCurrency)})
                    </label>
                    <div className="flex flex-wrap gap-sm items-center">
                      <input
                        type="text"
                        inputMode="decimal"
                        value={amountStr}
                        onChange={(e) => setAmountStr(e.target.value)}
                        placeholder="0.00"
                        className="flex-1 min-w-[8rem] bg-surface-container-lowest border border-outline-variant rounded-lg px-md py-sm font-body-md text-on-surface tabular-nums"
                      />
                      <button
                        type="button"
                        disabled={maxTowardPayee <= 0 || previewLoading || !hasSelectedPayee}
                        onClick={() => setAmountStr(maxTowardPayee.toFixed(2))}
                        className={`text-sm font-label-sm border border-outline-variant rounded-lg px-md py-sm hover:bg-surface-container-high disabled:opacity-50 ${
                          maxTowardPayee > 0 ? "text-balance-owe" : "text-on-surface-variant"
                        }`}
                      >
                        {hasSelectedPayee ? `Use max (${maxTowardPayee.toFixed(2)})` : "Select a member first"}
                      </button>
                    </div>
                    {previewLoading ? (
                      <p className="text-xs text-on-surface-variant mt-xs">
                        Loading expense breakdown…
                      </p>
                    ) : hasSelectedPayee ? (
                      <p className="text-xs text-on-surface-variant mt-xs">
                        Max toward {displayName(detail.members, payeeUserId)}:{" "}
                        <span className={`tabular-nums font-medium ${oweAmountClass(maxTowardPayee)}`}>
                          {maxTowardPayee.toFixed(2)}{" "}
                          {currencyCode(detail.defaultCurrency)}
                        </span>
                      </p>
                    ) : null}
                  </div>
                  <div>
                    <label className="block font-label-sm text-label-sm text-on-surface-variant mb-xs">
                      Note (optional)
                    </label>
                    <input
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      maxLength={300}
                      className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-md py-sm font-body-md text-on-surface"
                      placeholder="e.g. Venmo, cash"
                    />
                  </div>
                  {previewAllocations.length > 0 && (
                    <div className="rounded-lg border border-outline-variant/60 bg-surface-container-low p-sm">
                      <p className="font-label-sm text-on-surface-variant mb-xs">
                        Will apply to {previewAllocations.length} expense(s)
                      </p>
                      <ul className="text-xs text-on-surface-variant space-y-xs max-h-32 overflow-y-auto tabular-nums">
                        {previewAllocations.map((a) => {
                          const tx = txs.find((t) => t.id === a.transactionId);
                          return (
                            <li key={`${a.transactionId}-${a.allocatedAmount}`}>
                              {tx?.description?.trim() || "—"} ·{" "}
                              <span className={`font-medium ${oweAmountClass(a.allocatedAmount)}`}>
                                {a.allocatedAmount.toFixed(2)}{" "}
                                {currencyCode(detail.defaultCurrency)}
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}
                  {formErr && (
                    <div className="text-sm text-error font-body-md">{formErr}</div>
                  )}
                  <button
                    type="submit"
                    disabled={
                      formPending ||
                      !payeeUserId ||
                      previewLoading ||
                      maxTowardPayee <= 0 ||
                      payeeListboxOptions.length === 0
                    }
                    className="bg-primary text-on-primary font-label-sm py-sm px-md rounded-lg hover:bg-primary-container disabled:opacity-60"
                  >
                    {formPending ? "Saving…" : "Record settlement"}
                  </button>
                </>
              )}
            </form>
          </div>

          <div className="bg-surface rounded-xl border border-outline-variant shadow-level-1 overflow-hidden">
            <div className="px-lg py-sm bg-surface-container-low font-label-sm text-label-sm text-on-surface-variant border-b border-outline-variant flex justify-between items-center gap-sm">
              <span>Settlement history</span>
              <span className="tabular-nums text-on-surface">{rows.length}</span>
            </div>
            {rows.length === 0 ? (
              <div className="p-lg font-body-md text-on-surface-variant">
                No settlements recorded for this group.
              </div>
            ) : (
              <ul className="divide-y divide-outline-variant/40 max-h-[min(70vh,720px)] overflow-y-auto">
                {rows.map((s) => {
                  const cur = currencyValueFromApi(s.currency);
                  const canEditNote = s.payerUserId === payerId;
                  const canDelete =
                    s.payerUserId === payerId || s.payeeUserId === payerId;
                  return (
                    <li key={s.id} className="p-lg space-y-sm">
                      <div className="flex justify-between gap-md items-start">
                        <div className="min-w-0">
                          <p className="font-body-md font-semibold text-on-surface">
                            {displayName(detail?.members, s.payerUserId)} →{" "}
                            {displayName(detail?.members, s.payeeUserId)}
                          </p>
                          <p className="font-label-sm text-on-surface-variant">
                            {new Date(s.createdAt).toLocaleString()}
                            {s.note ? ` · ${s.note}` : ""}
                          </p>
                          {s.allocations.length > 0 && (
                            <div className="mt-xs">
                              <p className="text-xs text-on-surface-variant">
                                {s.allocations.length} expense allocation
                                {s.allocations.length === 1 ? "" : "s"}
                              </p>
                              <button
                                type="button"
                                onClick={() =>
                                  setVisibleAllocationsBySettlement((prev) => ({
                                    ...prev,
                                    [s.id]: !prev[s.id],
                                  }))
                                }
                                className="text-xs font-label-sm text-primary hover:underline"
                              >
                                {visibleAllocationsBySettlement[s.id]
                                  ? "Hide allocations"
                                  : "Show allocations"}
                              </button>
                            </div>
                          )}
                        </div>
                        <div className={`font-financial-xl text-[20px] shrink-0 tabular-nums ${owedAmountClass(s.amount)}`}>
                          {currencyCode(cur)} {s.amount.toFixed(2)}
                        </div>
                      </div>
                      {editingNoteId === s.id ? (
                        <div className="flex flex-col gap-sm pt-sm border-t border-outline-variant/30">
                          <textarea
                            value={noteDraft}
                            onChange={(e) => setNoteDraft(e.target.value)}
                            maxLength={300}
                            rows={2}
                            className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-md py-sm text-sm text-on-surface"
                          />
                          <div className="flex gap-sm">
                            <button
                              type="button"
                              disabled={notePending}
                              onClick={() => void saveNote(s)}
                              className="text-sm font-label-sm bg-secondary text-on-secondary px-md py-xs rounded-lg disabled:opacity-60"
                            >
                              Save note
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingNoteId(null)}
                              className="text-sm font-label-sm text-primary border border-outline-variant px-md py-xs rounded-lg"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-sm pt-sm border-t border-outline-variant/30">
                          {canEditNote && (
                            <button
                              type="button"
                              onClick={() => {
                                setEditingNoteId(s.id);
                                setNoteDraft(s.note ?? "");
                              }}
                              className="text-xs font-label-sm text-secondary hover:underline"
                            >
                              Edit note
                            </button>
                          )}
                          {canDelete && (
                            <button
                              type="button"
                              onClick={() => setSettlementToDelete(s)}
                              className="text-xs font-label-sm text-error hover:underline"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      )}
                        {visibleAllocationsBySettlement[s.id] && s.allocations.length > 0 && (
                          <div className="mt-sm border-t border-outline-variant/30 pt-sm">
                            <ul className="text-sm space-y-xs">
                              {s.allocations.map((a) => {
                                const tx = txs.find((t) => t.id === a.transactionId);
                                return (
                                  <li key={a.transactionId} className="flex justify-between">
                                    <div className="text-on-surface-variant">
                                      {tx?.description?.trim() || "—"}
                                      {tx ? ` · ${new Date(tx.createdAt).toLocaleDateString()}` : ""}
                                    </div>
                                    <div className={`font-medium ${oweAmountClass(a.allocatedAmount)}`}>
                                      {a.allocatedAmount.toFixed(2)} {currencyCode(detail?.defaultCurrency ?? 0)}
                                    </div>
                                  </li>
                                );
                              })}
                            </ul>
                          </div>
                        )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      )}
      <ConfirmDialog
        open={settlementToDelete != null}
        title="Remove this settlement?"
        description="Balances on the linked expenses will update to reflect that this payment no longer happened."
        confirmLabel="Remove settlement"
        cancelLabel="Keep it"
        danger
        pending={deletePending}
        onClose={() => !deletePending && setSettlementToDelete(null)}
        onConfirm={() => void deleteSettlementConfirmed()}
      />
      </div>
    </ErrorBoundary>
  );
}
