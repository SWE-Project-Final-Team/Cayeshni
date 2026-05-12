"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { apiJson } from "@/lib/api/client";
import type {
  GroupDetailDto,
  GroupDto,
  GroupMemberBalanceDto,
  SettlementDto,
  TransactionDetailDto,
  TransactionDto,
} from "@/lib/api/types";
import { ListboxSelect } from "@/components/listbox-select";
import { currencyApiName, currencyCode, currencyValueFromApi } from "@/lib/currency";
import { useAuth } from "@/lib/auth/auth-context";
import {
  buildAllocationsFifo,
  candidateTransactionIds,
  maxSettleableTowardPayee,
} from "@/lib/settlements/build-allocations";

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
  const [debts, setDebts] = useState<GroupMemberBalanceDto[]>([]);
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
      setDebts([]);
      setTxs([]);
      setRows([]);
      return;
    }
    setErr(null);
    try {
      const [d, b, t, s] = await Promise.all([
        apiJson<GroupDetailDto>(`/api/groups/${groupId}`, { accessToken }),
        apiJson<GroupMemberBalanceDto[]>(
          `/api/transactions/group/${groupId}/debts`,
          { accessToken }
        ),
        apiJson<TransactionDto[]>(`/api/transactions/group/${groupId}`, {
          accessToken,
        }),
        apiJson<SettlementDto[]>(`/api/settlements/${groupId}`, { accessToken }),
      ]);
      setDetail(d);
      setDebts(b);
      setTxs(t);
      setRows(s);
      setPayeeUserId("");
      setAmountStr("");
      setNote("");
      setPayeeDetails([]);
      setFormErr(null);
    } catch (e) {
      setErr(apiErrorMessage(e));
      setDetail(null);
      setDebts([]);
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
    if (!accessToken || !emailConfirmed || !groupId || !payerId || !payeeUserId) {
      setPayeeDetails([]);
      return;
    }
    if (payeeUserId === payerId) {
      setPayeeDetails([]);
      return;
    }

    const ids = candidateTransactionIds(txs, payerId, payeeUserId);
    if (ids.length === 0) {
      setPayeeDetails([]);
      return;
    }

    let cancelled = false;
    setPreviewLoading(true);
    void (async () => {
      try {
        const details = await Promise.all(
          ids.map((id) =>
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

  const maxTowardPayee = useMemo(
    () => maxSettleableTowardPayee(payeeDetails, payerId),
    [payeeDetails, payerId]
  );

  const previewAllocations = useMemo(() => {
    const n = Number.parseFloat(amountStr.replace(",", "."));
    if (!Number.isFinite(n) || n <= 0 || !payerId || payeeDetails.length === 0)
      return [];
    return buildAllocationsFifo(payeeDetails, payerId, n);
  }, [amountStr, payerId, payeeDetails]);

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
        `Amount cannot exceed what you still owe this member on shared expenses (${maxTowardPayee.toFixed(2)} ${currencyCode(detail.defaultCurrency)}).`
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

  async function deleteSettlement(s: SettlementDto) {
    if (!accessToken) return;
    if (!window.confirm("Remove this settlement record? Balances on linked expenses will update."))
      return;
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
      await loadGroupContext();
    } catch (e) {
      setErr(apiErrorMessage(e));
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

  const payeeOptions =
    detail?.members.filter((m) => m.userId !== payerId) ?? [];

  const groupListboxOptions = useMemo(
    () => groups.map((g) => ({ value: g.id, label: g.name })),
    [groups]
  );

  const payeeListboxOptions = useMemo(
    () =>
      payeeOptions.map((m) => ({
        value: m.userId,
        label: m.displayName,
      })),
    [payeeOptions]
  );

  return (
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
                Balances
              </h2>
              {detail == null ? (
                <p className="font-body-md text-on-surface-variant">Loading…</p>
              ) : debts.length === 0 ? (
                <p className="font-body-md text-on-surface-variant">
                  No members or debt data.
                </p>
              ) : (
                <ul className="divide-y divide-outline-variant/40 max-h-80 overflow-y-auto tabular-nums">
                  {debts.map((b) => (
                    <li
                      key={b.userId}
                      className="py-sm flex flex-wrap justify-between gap-sm text-sm"
                    >
                      <span className="text-on-surface font-medium">
                        {displayName(detail.members, b.userId)}
                      </span>
                      <span className="text-on-surface-variant">
                        Remaining owed:{" "}
                        <span className="text-on-surface">
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
                You record a payment <strong>from you</strong> to someone you owe
                through expenses <strong>they paid for</strong> in this group.
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
                      placeholder="Select member…"
                      emptyMessage="No other members in this group"
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
                        disabled={maxTowardPayee <= 0 || previewLoading}
                        onClick={() => setAmountStr(maxTowardPayee.toFixed(2))}
                        className="text-sm font-label-sm text-secondary border border-outline-variant rounded-lg px-md py-sm hover:bg-surface-container-high disabled:opacity-50"
                      >
                        Use max ({maxTowardPayee.toFixed(2)})
                      </button>
                    </div>
                    {previewLoading ? (
                      <p className="text-xs text-on-surface-variant mt-xs">
                        Loading expense breakdown…
                      </p>
                    ) : payeeUserId && payeeUserId !== payerId ? (
                      <p className="text-xs text-on-surface-variant mt-xs">
                        Max toward {displayName(detail.members, payeeUserId)}:{" "}
                        <span className="text-on-surface tabular-nums">
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
                              {tx?.description || "Expense"} ·{" "}
                              {a.allocatedAmount.toFixed(2)}{" "}
                              {currencyCode(detail.defaultCurrency)}
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
                      maxTowardPayee <= 0
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
                            <p className="text-xs text-on-surface-variant mt-xs">
                              {s.allocations.length} expense allocation
                              {s.allocations.length === 1 ? "" : "s"}
                            </p>
                          )}
                        </div>
                        <div className="font-financial-xl text-[20px] text-primary shrink-0 tabular-nums">
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
                              onClick={() => void deleteSettlement(s)}
                              className="text-xs font-label-sm text-error hover:underline"
                            >
                              Delete
                            </button>
                          )}
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
    </div>
  );
}
