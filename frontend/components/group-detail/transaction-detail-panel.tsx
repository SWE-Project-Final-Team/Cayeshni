"use client";

import type { SettlementDto, TransactionDetailDto, TransactionDto } from "@/lib/api/types";
import { owedAmountClass, oweAmountClass } from "@/lib/balance-tone";
import { currencyCode, currencyValueFromApi } from "@/lib/currency";
import { useI18n } from "@/lib/i18n";

type Roster = { userId: string; displayName: string }[];

type Props = {
  listRow: TransactionDto | null;
  detail: TransactionDetailDto | null;
  detailLoading: boolean;
  roster: Roster;
  selfUserId?: string;
  categoryDisplay: string;
  settlementsTouching: SettlementDto[];
  /** When false, hide the per-member share/settled list (e.g. shown elsewhere in the hub). */
  showPerMemberBalances?: boolean;
  /** When false, hide settlements that touch this expense. */
  showSettlementsTouching?: boolean;
};

function rosterName(
  roster: Roster,
  userId: string,
  selfId: string | undefined,
  selfLabel: string
): string {
  if (selfId && userId === selfId) return selfLabel;
  return roster.find((r) => r.userId === userId)?.displayName ?? userId.slice(0, 8);
}

export function TransactionDetailPanel({
  listRow,
  detail,
  detailLoading,
  roster,
  selfUserId,
  categoryDisplay,
  settlementsTouching,
  showPerMemberBalances = true,
  showSettlementsTouching = true,
}: Props) {
  const { t, locale } = useI18n();
  const youLabel = t("You");
  if (!listRow) {
    return (
      <div className="rounded-2xl border border-outline-variant/90 bg-surface-container-lowest p-xl shadow-[0_8px_28px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_28px_rgba(0,0,0,0.3)] min-h-[220px] flex flex-col items-center justify-center gap-sm text-center">
        <span className="material-symbols-outlined text-4xl text-on-surface-variant/50">
          info
        </span>
        <p className="font-body-md text-on-surface-variant max-w-xs">
          {t(
            "Select an expense from the list to see the full breakdown and settlements."
          )}
        </p>
      </div>
    );
  }

  const cur = detail
    ? currencyValueFromApi(detail.currency)
    : listRow.currency;
  const curLabel = currencyCode(cur);
  const payerName = rosterName(roster, listRow.paidByUserId, selfUserId, youLabel);

  return (
    <div className="rounded-2xl border border-outline-variant/90 bg-surface-container-lowest overflow-hidden shadow-[0_8px_28px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_28px_rgba(0,0,0,0.3)] min-h-[320px] flex flex-col">
      <div className="border-t-4 border-secondary bg-gradient-to-br from-surface-container-high/50 to-transparent px-lg pt-md pb-sm">
        <div className="flex items-center gap-sm">
          <span className="material-symbols-outlined text-secondary text-[26px]">receipt</span>
          <h3 className="font-headline-md text-headline-md text-on-surface">
            {t("Transaction details")}
          </h3>
        </div>
      </div>

      <div className="p-lg space-y-md flex-1">
      {detailLoading ? (
        <p className="font-body-md text-on-surface-variant">
          {t("Loading breakdown…")}
        </p>
      ) : null}

      <dl className="space-y-sm font-body-md text-on-surface">
        <div className="flex justify-between gap-md">
          <dt className="text-on-surface-variant">{t("Description")}</dt>
          <dd className="font-semibold text-right min-w-0">
            {listRow.description?.trim() || "—"}
          </dd>
        </div>
        <div className="flex justify-between gap-md">
          <dt className="text-on-surface-variant">{t("Paid by")}</dt>
          <dd className="font-semibold text-right">{payerName}</dd>
        </div>
        <div className="flex justify-between gap-md">
          <dt className="text-on-surface-variant">{t("Total")}</dt>
          <dd className="font-financial-xl text-[1.25rem] text-secondary tabular-nums">
            {curLabel} {listRow.totalAmount.toFixed(2)}
          </dd>
        </div>
        <div className="flex justify-between gap-md">
          <dt className="text-on-surface-variant">{t("Category")}</dt>
          <dd className="text-right">{categoryDisplay}</dd>
        </div>
        <div className="flex justify-between gap-md">
          <dt className="text-on-surface-variant">{t("When")}</dt>
          <dd className="text-right text-sm tabular-nums">
            {new Date(listRow.createdAt).toLocaleString(locale, {
              dateStyle: "medium",
              timeStyle: "short",
            })}
          </dd>
        </div>
      </dl>

      {showPerMemberBalances ? (
      <div>
        <h4 className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider mb-sm">
          {t("Who owes what")}
        </h4>
        {detail?.members?.length ? (
          <ul className="divide-y divide-outline-variant/50 border border-outline-variant/60 rounded-lg overflow-hidden">
            {detail.members.map((m) => (
              <li
                key={m.userId}
                className="px-md py-sm bg-surface flex flex-col gap-xs text-sm"
              >
                <div className="flex justify-between gap-md font-semibold text-on-surface">
                  <span>{rosterName(roster, m.userId, selfUserId, youLabel)}</span>
                  <span className="tabular-nums text-on-surface-variant">
                    {t("Share")} {" "}
                    <span className={`tabular-nums ${oweAmountClass(m.totalOwed)}`}>
                      {curLabel} {m.totalOwed.toFixed(2)}
                    </span>
                  </span>
                </div>
                <div className="flex justify-between gap-md text-xs text-on-surface-variant tabular-nums">
                  <span>
                    {t("Settled")} {" "}
                    <span className={`tabular-nums ${owedAmountClass(m.settledAmount)}`}>
                      {curLabel} {m.settledAmount.toFixed(2)}
                    </span>
                  </span>
                  <span className="font-medium">
                    {t("Remaining")} {" "}
                    <span className={`tabular-nums font-medium ${oweAmountClass(m.remainingOwed)}`}>
                      {curLabel} {m.remainingOwed.toFixed(2)}
                    </span>
                  </span>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <ul className="divide-y divide-outline-variant/50 border border-outline-variant/60 rounded-lg overflow-hidden">
            {listRow.members.map((m) => (
              <li
                key={m.userId}
                className="px-md py-sm bg-surface flex justify-between gap-md text-sm font-medium text-on-surface"
              >
                <span>{rosterName(roster, m.userId, selfUserId, youLabel)}</span>
                <span className="tabular-nums text-on-surface-variant">
                  <span className={`tabular-nums ${oweAmountClass(m.amountOwed)}`}>
                    {curLabel} {m.amountOwed.toFixed(2)}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
      ) : null}

      {showSettlementsTouching && settlementsTouching.length > 0 ? (
        <div>
          <h4 className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider mb-sm">
            {t("Settlements touching this expense")}
          </h4>
          <ul className="space-y-sm">
            {settlementsTouching.map((s) => {
              const sc = currencyValueFromApi(s.currency);
              const alloc = s.allocations.filter(
                (a) => a.transactionId === listRow.id
              );
              return (
                <li
                  key={s.id}
                  className="rounded-lg border border-outline-variant/70 bg-surface px-md py-sm text-sm"
                >
                  <p className="font-medium text-on-surface">
                    {rosterName(roster, s.payerUserId, selfUserId, youLabel)} →{" "}
                    {rosterName(roster, s.payeeUserId, selfUserId, youLabel)} ·{" "}
                    <span className={`tabular-nums ${owedAmountClass(s.amount)}`}>
                      {currencyCode(sc)} {s.amount.toFixed(2)}
                    </span>
                  </p>
                  <p className="text-xs text-on-surface-variant mt-xs tabular-nums">
                    {new Date(s.createdAt).toLocaleString(locale, {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                    {alloc.length > 0 && (
                      <span className="ml-sm">
                        ({t("this bill")}:{" "}
                        {alloc.map((a, i) => (
                          <span key={`${a.transactionId}-${a.debtorUserId}-${i}`} className={oweAmountClass(a.allocatedAmount)}>
                            {currencyCode(sc)} {a.allocatedAmount.toFixed(2)}
                            {i < alloc.length - 1 ? ", " : ""}
                          </span>
                        ))}
                        )
                      </span>
                    )}
                  </p>
                  {s.note?.trim() ? (
                    <p className="text-xs text-on-surface-variant mt-xs italic">
                      {s.note}
                    </p>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
      </div>
    </div>
  );
}
