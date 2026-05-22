"use client";

import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useSearchParams } from "next/navigation";
import { apiJson } from "@/lib/api/client";
import type {
  GroupDetailDto,
  GroupDto,
  TransactionDto,
} from "@/lib/api/types";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { currencyCode, currencyValueFromApi } from "@/lib/currency";
import { equalParts, toCents } from "@/lib/money-split";
import { useAuth } from "@/lib/auth/auth-context";
import { ListboxSelect } from "@/components/listbox-select";
import { useI18n } from "@/lib/i18n";
import ErrorBoundary from "@/components/error-boundary";

const CATEGORIES: { value: number; key: string }[] = [
  { value: 0, key: "Transport" },
  { value: 1, key: "Food" },
  { value: 2, key: "Accommodation" },
  { value: 3, key: "Entertainment" },
  { value: 4, key: "Utilities" },
  { value: 5, key: "Shopping" },
  { value: 6, key: "Other" },
];

function normalizeGroup(
  g: GroupDto & { defaultCurrency?: string | number },
): GroupDto {
  return {
    ...g,
    defaultCurrency: currencyValueFromApi(g.defaultCurrency),
  };
}

function normalizeGroupDetail(
  d: GroupDetailDto & { defaultCurrency?: string | number },
): GroupDetailDto {
  return {
    ...d,
    defaultCurrency: currencyValueFromApi(d.defaultCurrency),
  };
}

export default function ExpensesPage() {
  const { t } = useI18n();
  return (
    <Suspense
      fallback={
        <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-lg font-body-md text-on-surface-variant">
          {t("Loading expenses…")}
        </div>
      }
    >
      <ErrorBoundary>
        <ExpensesPageInner />
      </ErrorBoundary>
    </Suspense>
  );
}

function ExpensesPageInner() {
  const searchParams = useSearchParams();
  const urlGroupApplied = useRef(false);
  const { accessToken, emailConfirmed, profile, apiErrorMessage } = useAuth();
  const { t } = useI18n();
  const [groups, setGroups] = useState<GroupDto[]>([]);
  const [groupId, setGroupId] = useState("");
  const [groupDetail, setGroupDetail] = useState<GroupDetailDto | null>(null);
  const [txs, setTxs] = useState<TransactionDto[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [formErr, setFormErr] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<TransactionDto | null>(null);
  const [deletePending, setDeletePending] = useState(false);
  const [editingTxId, setEditingTxId] = useState<string | null>(null);
  const [editDescription, setEditDescription] = useState("");
  const [editCategory, setEditCategory] = useState<number>(6);
  const [editPending, setEditPending] = useState(false);

  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState(6);
  const [equalSplit, setEqualSplit] = useState(true);
  const [customParts, setCustomParts] = useState<Record<string, string>>({});

  const selectedGroup = useMemo(
    () => groups.find((g) => g.id === groupId),
    [groups, groupId],
  );

  const groupOptions = useMemo(
    () =>
      groups.map((g) => ({
        value: g.id,
        label: g.name,
        description: t("Default currency · {currency}", {
          currency: currencyCode(g.defaultCurrency),
        }),
      })),
    [groups, t],
  );

  const categoryOptions = useMemo(
    () =>
      CATEGORIES.map((c) => ({
        value: String(c.value),
        label: t(c.key),
      })),
    [t],
  );

  function categoryLabel(c: number): string {
    const match = CATEGORIES.find((x) => x.value === c);
    return match ? t(match.key) : t("Category {id}", { id: c });
  }

  function expensePayerLabel(
    paidByUserId: string,
    paidByDisplayName: string,
    selfId: string | undefined,
  ): string {
    if (selfId && paidByUserId === selfId) return t("you");
    const name = paidByDisplayName?.trim();
    if (name) return name;
    return t("Member");
  }

  const loadGroups = useCallback(async () => {
    if (!accessToken || !emailConfirmed) return;
    try {
      const raw = await apiJson<
        (GroupDto & { defaultCurrency?: string | number })[]
      >("/api/groups", { accessToken });
      setGroups(raw.map(normalizeGroup));
      setGroupId((prev) => prev || raw[0]?.id || "");
    } catch (e) {
      setErr(apiErrorMessage(e));
    }
  }, [accessToken, emailConfirmed, apiErrorMessage]);

  const loadTx = useCallback(async () => {
    if (!accessToken || !emailConfirmed || !groupId) {
      setTxs([]);
      return;
    }
    setErr(null);
    try {
      const data = await apiJson<TransactionDto[]>(
        `/api/transactions/group/${groupId}`,
        { accessToken },
      );
      setTxs(data);
    } catch (e) {
      setErr(apiErrorMessage(e));
      setTxs([]);
    }
  }, [accessToken, emailConfirmed, groupId, apiErrorMessage]);

  const loadGroupDetail = useCallback(async () => {
    if (!accessToken || !emailConfirmed || !groupId) {
      setGroupDetail(null);
      return;
    }
    try {
      const data = await apiJson<
        GroupDetailDto & { defaultCurrency?: string | number }
      >(`/api/groups/${groupId}`, { accessToken });
      setGroupDetail(normalizeGroupDetail(data));
    } catch {
      setGroupDetail(null);
    }
  }, [accessToken, emailConfirmed, groupId]);

  useEffect(() => {
    void loadGroups();
  }, [loadGroups]);

  useEffect(() => {
    if (groups.length === 0 || urlGroupApplied.current) return;
    const g = searchParams.get("group");
    if (g && groups.some((x) => x.id === g)) {
      setGroupId(g);
    }
    urlGroupApplied.current = true;
  }, [groups, searchParams]);

  useEffect(() => {
    void loadTx();
  }, [loadTx]);

  useEffect(() => {
    void loadGroupDetail();
  }, [loadGroupDetail]);

  const memberIds = useMemo(
    () => groupDetail?.members.map((m) => m.userId).sort() ?? [],
    [groupDetail?.members],
  );

  const memberById = useMemo(
    () => new Map((groupDetail?.members ?? []).map((m) => [m.userId, m])),
    [groupDetail?.members],
  );

  const sortedTxs = useMemo(
    () =>
      [...txs].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ),
    [txs]
  );

  useEffect(() => {
    const total = parseFloat(amount.replace(",", ".")) || 0;
    if (!equalSplit || memberIds.length === 0 || total <= 0) return;
    const parts = equalParts(total, memberIds.length);
    const next: Record<string, string> = {};
    memberIds.forEach((id, i) => {
      next[id] = parts[i]?.toFixed(2) ?? "0.00";
    });
    setCustomParts(next);
  }, [amount, equalSplit, memberIds]);

  async function addTransaction(e: React.FormEvent) {
    e.preventDefault();
    if (!accessToken || !groupId || !selectedGroup) return;

    const total = parseFloat(amount.replace(",", ".")) || 0;
    if (total <= 0) {
      setFormErr(t("Enter an amount greater than zero."));
      return;
    }
    if (memberIds.length === 0) {
      setFormErr(t("This group has no members to split with yet."));
      return;
    }

    let splits: { userId: string; amountOwed: number }[];
    if (equalSplit) {
      const parts = equalParts(total, memberIds.length);
      splits = memberIds.map((userId, i) => ({
        userId,
        amountOwed: parts[i] ?? 0,
      }));
    } else {
      splits = memberIds.map((userId) => ({
        userId,
        amountOwed:
          parseFloat((customParts[userId] ?? "0").replace(",", ".")) || 0,
      }));
    }

    const sumCents = splits.reduce((s, x) => s + toCents(x.amountOwed), 0);
    if (sumCents !== toCents(total)) {
      setFormErr(
        t("Splits must add up to {total} {currency}. Current: {current}.", {
          total: total.toFixed(2),
          currency: currencyCode(selectedGroup.defaultCurrency),
          current: (sumCents / 100).toFixed(2),
        }),
      );
      return;
    }

    setFormErr(null);
    setSubmitting(true);
    try {
      await apiJson<TransactionDto>("/api/transactions", {
        method: "POST",
        accessToken,
        json: {
          groupId,
          totalAmount: total,
          currency: selectedGroup.defaultCurrency,
          category,
          description: description.trim() || null,
          members: splits,
        },
      });
      setAmount("");
      setDescription("");
      setCategory(6);
      setEqualSplit(true);
      await loadTx();
    } catch (e) {
      setFormErr(apiErrorMessage(e));
    } finally {
      setSubmitting(false);
    }
  }

  async function deleteTransactionConfirmed() {
    const tx = transactionToDelete;
    if (!accessToken || !tx) return;
    setDeletePending(true);
    setFormErr(null);
    try {
      await apiJson(`/api/transactions/${tx.id}`, {
        method: "DELETE",
        accessToken,
      });
      setTransactionToDelete(null);
      await loadTx();
    } catch (e) {
      setFormErr(apiErrorMessage(e));
    } finally {
      setDeletePending(false);
    }
  }

  if (!emailConfirmed) {
    return (
      <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-lg font-body-md text-on-surface-variant">
        {t("Confirm your email to load expenses from the API.")}
      </div>
    );
  }

  const currencyLabel = selectedGroup
    ? currencyCode(selectedGroup.defaultCurrency)
    : "";

  return (
    <div className="space-y-xl">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-md">
        <div>
          <h2 className="font-display-lg text-display-lg text-on-surface">
            {t("Expenses")}
          </h2>
          <p className="font-body-md text-body-md text-on-surface-variant mt-xs">
            {t(
              "Add transactions for a group. Amounts use the group&apos;s default currency ({currency}). You are recorded as the person who paid.",
              { currency: currencyLabel || "—" },
            )}
          </p>
        </div>
        <div className="flex flex-col gap-xs w-full sm:w-auto sm:min-w-[260px]">
          <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
            {t("Group")}
          </span>
          <ListboxSelect
            value={groupId}
            onChange={setGroupId}
            options={groupOptions}
            placeholder="Choose a group"
            emptyMessage="No groups yet — create one under Groups"
            leadingIcon="groups"
            className="w-full min-w-0 sm:min-w-[240px]"
            align="end"
          />
        </div>
      </div>

      {err && (
        <div className="rounded-lg bg-error-container/40 text-error px-md py-sm font-body-md">
          {err}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-lg">
        <div className="xl:col-span-7 space-y-md">
          <div className="bg-surface rounded-[16px] border border-outline-variant shadow-level-1 overflow-hidden">
            <div className="bg-surface-container-low px-lg py-sm font-label-sm text-label-sm text-on-surface-variant border-b border-outline-variant">
              {t("Transactions")}
            </div>
            {sortedTxs.length === 0 ? (
              <div className="p-lg font-body-md text-on-surface-variant">
                {t("No transactions in this group yet.")}
              </div>
            ) : (
              <ul>
                {sortedTxs.map((tx, i) => (
                  <li
                    key={tx.id}
                    className={`flex items-start p-lg border-b border-outline-variant last:border-0 hover:bg-surface-container-lowest transition-colors ${
                      i % 2 === 1 ? "bg-surface-container-low" : ""
                    }`}
                  >
                    <div className="flex items-start gap-md min-w-0 flex-1">
                      <div className="w-12 h-12 rounded-full bg-secondary-fixed flex items-center justify-center text-on-secondary-fixed shrink-0 mt-0.5">
                        <span className="material-symbols-outlined text-[22px]">
                          receipt_long
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-col gap-px">
                          <div className="flex justify-between items-baseline gap-md">
                            <span className="font-label-sm text-label-sm text-on-surface-variant shrink-0">
                              {t("Description")}
                            </span>
                            <span className="font-financial-xl text-[20px] leading-tight text-on-surface tabular-nums shrink-0">
                              {currencyCode(tx.currency)}{" "}
                              {tx.totalAmount.toFixed(2)}
                            </span>
                          </div>
                          <div className="font-body-md text-body-md font-bold text-on-surface truncate">
                            {tx.description?.trim() || "—"}
                          </div>
                        </div>
                        <div className="font-label-sm text-label-sm text-on-surface-variant mt-xs">
                          {t("Paid by")}{" "}
                          {expensePayerLabel(
                            tx.paidByUserId,
                            tx.paidByDisplayName,
                            profile?.id,
                          )}{" "}
                          · {categoryLabel(tx.category)}
                        </div>
                        {profile?.id === tx.paidByUserId && (
                          <div className="mt-sm flex gap-sm">
                            {editingTxId !== tx.id ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingTxId(tx.id);
                                    setEditDescription(tx.description ?? "");
                                    setEditCategory(tx.category ?? 6);
                                  }}
                                  className="text-xs font-label-sm text-primary hover:underline"
                                >
                                  Edit
                                </button>
                              </>
                            ) : null}
                            <button
                              type="button"
                              onClick={() => setTransactionToDelete(tx)}
                              className="text-xs font-label-sm text-error hover:underline"
                            >
                              Delete
                            </button>
                          </div>
                        )}
                        {editingTxId === tx.id && (
                          <div className="mt-sm pt-sm border-t border-outline-variant/30 w-full">
                            <div className="flex flex-col gap-sm">
                              <input
                                value={editDescription}
                                onChange={(e) => setEditDescription(e.target.value)}
                                placeholder="Description"
                                className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-md py-sm text-sm"
                              />
                              <div className="flex gap-sm items-center">
                                <ListboxSelect
                                  value={String(editCategory)}
                                  onChange={(v) => setEditCategory(Number(v))}
                                  options={categoryOptions}
                                  className="w-40"
                                />
                                <div className="flex gap-sm ml-auto">
                                  <button
                                    type="button"
                                    disabled={editPending}
                                    onClick={async () => {
                                      if (!accessToken) return;
                                      setEditPending(true);
                                      try {
                                        await apiJson<TransactionDto>("/api/transactions", {
                                          method: "PUT",
                                          accessToken,
                                          json: {
                                            id: tx.id,
                                            description: editDescription.trim() || null,
                                            category: editCategory,
                                          },
                                        });
                                        setEditingTxId(null);
                                        await loadTx();
                                      } catch (e) {
                                        setFormErr(apiErrorMessage(e));
                                      } finally {
                                        setEditPending(false);
                                      }
                                    }}
                                    className="text-sm font-label-sm bg-secondary text-on-secondary px-md py-xs rounded-lg disabled:opacity-60"
                                  >
                                    Save
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setEditingTxId(null)}
                                    className="text-sm font-label-sm text-primary border border-outline-variant px-md py-xs rounded-lg"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="xl:col-span-5">
          <form
            onSubmit={addTransaction}
            className="bg-surface rounded-[16px] border border-outline-variant shadow-level-2 p-lg sticky top-lg space-y-md"
          >
            <h3 className="font-headline-md text-headline-md text-on-surface border-b border-outline-variant pb-sm">
              {t("Add expense")}
            </h3>

            {formErr && (
              <div className="rounded-lg bg-error-container/40 text-error px-md py-sm font-body-md text-sm">
                {formErr}
              </div>
            )}

            {!selectedGroup ? (
              <p className="font-body-md text-on-surface-variant">
                {t("Select a group to add an expense.")}
              </p>
            ) : (
              <>
                <p className="font-label-sm text-on-surface-variant">
                  {t("Currency")}:{" "}
                  <span className="text-on-surface font-semibold">
                    {currencyLabel}
                  </span>{" "}
                  {t("(must match the group — set when the group was created)")}
                </p>

                <div>
                  <label className="block font-label-sm text-label-sm text-on-surface-variant mb-xs">
                    {t("Amount ({currency})", { currency: currencyLabel })}
                  </label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder={t("0.00")}
                    className="w-full bg-surface border border-outline-variant rounded-lg px-md py-sm font-financial-xl text-[24px] text-on-surface focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20"
                    required
                  />
                </div>

                <div>
                  <label className="block font-label-sm text-label-sm text-on-surface-variant mb-xs">
                    {t("Description (optional)")}
                  </label>
                  <input
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder={t("Dinner, rent, taxi…")}
                    className="w-full bg-surface border border-outline-variant rounded-lg px-md py-sm font-body-md text-on-surface focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20"
                  />
                </div>

                <div>
                  <span className="block font-label-sm text-label-sm text-on-surface-variant mb-xs">
                    {t("Category")}
                  </span>
                  <ListboxSelect
                    value={String(category)}
                    onChange={(v) => setCategory(Number(v))}
                    options={categoryOptions}
                    placeholder="Pick a category"
                    leadingIcon="category"
                    className="w-full"
                  />
                </div>

                <div className="border border-outline-variant/60 rounded-lg p-md space-y-sm">
                  <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
                    {t("Split between members")}
                  </p>
                  <label className="flex items-center gap-sm cursor-pointer font-body-md text-on-surface">
                    <input
                      type="radio"
                      name="split"
                      checked={equalSplit}
                      onChange={() => setEqualSplit(true)}
                      className="accent-secondary"
                    />
                    {t("Equal split ({count} member)", {
                      count: memberIds.length,
                    })}
                    {memberIds.length === 1 ? "" : t("s")}
                  </label>
                  <label className="flex items-center gap-sm cursor-pointer font-body-md text-on-surface">
                    <input
                      type="radio"
                      name="split"
                      checked={!equalSplit}
                      onChange={() => {
                        setEqualSplit(false);
                        const total = parseFloat(amount.replace(",", ".")) || 0;
                        if (total > 0 && memberIds.length > 0) {
                          const parts = equalParts(total, memberIds.length);
                          const next: Record<string, string> = {};
                          memberIds.forEach((id, i) => {
                            next[id] = (parts[i] ?? 0).toFixed(2);
                          });
                          setCustomParts(next);
                        }
                      }}
                      className="accent-secondary"
                    />
                    {t("Custom amounts")}
                  </label>
                </div>

                {!equalSplit && memberIds.length > 0 && (
                  <div className="space-y-sm max-h-56 overflow-y-auto pr-3 [scrollbar-gutter:stable]">
                    {memberIds.map((id) => {
                      const memberInfo = memberById.get(id);
                      const displayName =
                        memberInfo?.displayName || `${id.slice(0, 8)}…`;
                      return (
                        <div
                          key={id}
                          className="flex items-center justify-between gap-sm rounded-lg border border-outline-variant/40 bg-surface px-sm py-xs"
                        >
                          <span className="font-label-sm text-on-surface-variant truncate max-w-[50%]">
                            {id === profile?.id ? t("You") : displayName}
                          </span>
                          <input
                            type="text"
                            inputMode="decimal"
                            value={customParts[id] ?? ""}
                            onChange={(e) =>
                              setCustomParts((prev) => ({
                                ...prev,
                                [id]: e.target.value,
                              }))
                            }
                            className="w-28 bg-surface-container-lowest border border-outline-variant rounded-lg px-sm py-xs font-body-md text-right text-on-surface"
                          />
                        </div>
                      );
                    })}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting || !groupId || memberIds.length === 0}
                  className="w-full bg-secondary text-on-secondary font-label-sm py-md rounded-lg hover:bg-secondary/90 disabled:opacity-50 flex justify-center items-center gap-sm"
                >
                  {submitting ? (
                    t("Saving…")
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[20px]">
                        add
                      </span>
                      {t("Add transaction")}
                    </>
                  )}
                </button>
              </>
            )}
          </form>
        </div>
      </div>

      <ConfirmDialog
        open={transactionToDelete != null}
        title="Delete this expense?"
        description="This will remove the transaction. If it already has settlements, the API may reject the delete until those are removed first."
        confirmLabel="Delete expense"
        cancelLabel="Keep it"
        danger
        pending={deletePending}
        onClose={() => !deletePending && setTransactionToDelete(null)}
        onConfirm={() => void deleteTransactionConfirmed()}
      />
    </div>
  );
}
