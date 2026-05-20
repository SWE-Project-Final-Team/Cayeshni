"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { apiJson } from "@/lib/api/client";
import type {
  DashboardActivityItemDto,
  DashboardGroupBalanceDto,
} from "@/lib/api/types";
import { owedAmountClass, oweAmountClass } from "@/lib/balance-tone";
import { currencyCode, currencyValueFromApi } from "@/lib/currency";
import { useAuth } from "@/lib/auth/auth-context";
import { useI18n } from "@/lib/i18n";

function formatMoney(currency: string | number, amount: number): string {
  const c = currencyValueFromApi(currency);
  return `${currencyCode(c)} ${amount.toFixed(2)}`;
}

function displayActor(
  meId: string | undefined,
  actorId: string | null,
  actorName: string | null,
  someoneLabel: string,
  youLabel: string
): string {
  if (!actorName) return someoneLabel;
  if (meId && actorId && actorId === meId) return youLabel;
  return actorName;
}

function formatActivityTime(
  iso: string,
  locale: string
): { label: string; titleAttr: string } {
  const d = new Date(iso);
  return {
    label: d.toLocaleString(locale, {
      dateStyle: "medium",
      timeStyle: "short",
    }),
    titleAttr: d.toLocaleString(locale, {
      dateStyle: "full",
      timeStyle: "medium",
    }),
  };
}

function DashboardActivityRow({
  item,
  profileId,
  locale,
  t,
}: {
  item: DashboardActivityItemDto;
  profileId: string | undefined;
  locale: string;
  t: (key: string, vars?: Record<string, string | number>) => string;
}) {
  const amountStr = formatMoney(item.currency, item.amount);
  const when = formatActivityTime(item.createdAt, locale);
  const href =
    item.kind === "transaction"
      ? `/expenses?group=${encodeURIComponent(item.groupId)}`
      : "/settlements";

  const isTx = item.kind === "transaction";

  return (
    <li className="list-none">
      <Link
        href={href}
        title={when.titleAttr}
        className="group flex gap-md sm:gap-lg rounded-2xl border border-outline-variant/60 bg-surface-container-low/90 p-md sm:p-lg hover:border-secondary/35 hover:bg-surface-container-high/70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary transition-colors"
      >
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
            isTx
              ? "bg-primary-fixed/45 text-primary"
              : "bg-secondary-fixed/55 text-secondary"
          }`}
          aria-hidden
        >
          <span className="material-symbols-outlined text-[22px]">
            {isTx ? "receipt_long" : "payments"}
          </span>
        </div>

        <div className="min-w-0 flex-1 flex flex-col gap-xs">
          <div className="flex flex-wrap items-center gap-x-sm gap-y-xs">
            <span
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                isTx
                  ? "bg-primary-fixed/50 text-on-primary-fixed-variant"
                  : "bg-secondary-fixed/60 text-secondary"
              }`}
            >
              {isTx ? t("Expense") : t("Settlement")}
            </span>
            <span className="font-label-sm text-label-sm text-on-surface-variant truncate max-w-[12rem] sm:max-w-none">
              {item.groupName}
            </span>
          </div>

          {isTx ? (
            <>
              <p className="font-body-md text-on-surface leading-snug">
                <span className="font-semibold text-primary">
                  {displayActor(
                    profileId,
                    item.actorUserId,
                    item.actorName,
                    t("Someone"),
                    t("You")
                  )}
                </span>{" "}
                <span className="text-on-surface-variant">{t("paid")}</span>
                {item.description?.trim() ? (
                  <>
                    <span className="text-on-surface-variant"> · </span>
                    <span className="text-on-surface">{item.description.trim()}</span>
                  </>
                ) : null}
              </p>
            </>
          ) : (
            <>
              <p className="font-body-md text-on-surface leading-snug">
                <span className="font-semibold text-primary">
                  {displayActor(
                    profileId,
                    item.actorUserId,
                    item.actorName,
                    t("Someone"),
                    t("You")
                  )}
                </span>
                <span className="text-on-surface-variant"> {t("paid")} </span>
                <span className="font-semibold text-primary">
                  {displayActor(
                    profileId,
                    item.counterpartyUserId,
                    item.counterpartyName,
                    t("Someone"),
                    t("You")
                  )}
                </span>
              </p>
              {item.note?.trim() ? (
                <p className="text-sm text-on-surface-variant line-clamp-2 border-l-2 border-outline-variant pl-sm">
                  {item.note.trim()}
                </p>
              ) : null}
            </>
          )}

          <time
            dateTime={item.createdAt}
            className="text-xs text-on-surface-variant tabular-nums sm:hidden"
          >
            {when.label}
          </time>
        </div>

        <div className="shrink-0 flex flex-col items-end gap-xs text-right">
          <p className="font-financial-xl text-[1.125rem] sm:text-[1.25rem] text-on-surface tabular-nums leading-tight">
            {amountStr}
          </p>
          <time
            dateTime={item.createdAt}
            className="hidden sm:block text-xs text-on-surface-variant tabular-nums"
          >
            {when.label}
          </time>
          <span className="text-[10px] font-label-sm uppercase tracking-wide text-secondary opacity-0 group-hover:opacity-100 transition-opacity">
            {t("View")}
          </span>
        </div>
      </Link>
    </li>
  );
}

export default function DashboardPage() {
  const { accessToken, emailConfirmed, profile, apiErrorMessage } = useAuth();
  const { t, locale } = useI18n();
  const [balances, setBalances] = useState<DashboardGroupBalanceDto[] | null>(
    null
  );
  const [activity, setActivity] = useState<DashboardActivityItemDto[] | null>(
    null
  );
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken || !emailConfirmed) {
      setBalances([]);
      setActivity([]);
      return;
    }
    let cancelled = false;
    (async () => {
      setErr(null);
      try {
        const [b, a] = await Promise.all([
          apiJson<DashboardGroupBalanceDto[]>("/api/dashboard/group-balances", {
            accessToken,
          }),
          apiJson<DashboardActivityItemDto[]>(
            "/api/dashboard/recent-activity?limit=18",
            { accessToken }
          ),
        ]);
        if (!cancelled) {
          setBalances(b);
          setActivity(a);
        }
      } catch (e) {
        if (!cancelled) setErr(apiErrorMessage(e));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [accessToken, emailConfirmed, apiErrorMessage]);

  const totalsByCurrency = useMemo(() => {
    if (!balances?.length) return [];
    const map = new Map<
      number,
      { currency: number; owe: number; owed: number }
    >();
    for (const row of balances) {
      const c = currencyValueFromApi(row.currency);
      const cur = map.get(c) ?? { currency: c, owe: 0, owed: 0 };
      cur.owe += row.youOwe;
      cur.owed += row.youAreOwed;
      map.set(c, cur);
    }
    return [...map.values()];
  }, [balances]);

  const groupCount = balances?.length ?? 0;

  return (
    <div className="space-y-xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-md">
        <div>
          <h2 className="font-display-lg text-display-lg text-on-surface">
            {t("Dashboard")}
          </h2>
          <p className="font-body-md text-body-md text-on-surface-variant mt-xs">
            {t("Balances per group and your latest expense activity.")}
          </p>
        </div>
        <div className="hidden md:flex items-center gap-sm">
          <Link
            href="/expenses"
            className="bg-secondary text-on-secondary font-label-sm py-sm px-md rounded-lg hover:bg-secondary/90 flex items-center gap-xs"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            {t("Add expense")}
          </Link>
        </div>
      </div>

      {err && (
        <div className="rounded-lg border border-error/30 bg-error-container/30 text-error px-md py-sm font-body-md">
          {err}
        </div>
      )}

      {!emailConfirmed && (
        <div className="rounded-[16px] border border-outline-variant bg-surface-container-lowest p-lg shadow-level-1">
          <p className="font-body-md text-on-surface">
            {t("Confirm your email to load balances and activity from the API.")}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-md gap-container-margin">
        <div className="bg-surface-container-lowest border border-outline-variant/80 rounded-[16px] p-lg shadow-level-1 flex flex-col justify-between">
          <div>
            <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
              {t("Active groups")}
            </p>
            <h3 className="font-financial-xl text-financial-xl text-primary mt-sm">
              {emailConfirmed ? groupCount : "—"}
            </h3>
          </div>
          <Link
            href="/groups"
            className="mt-xl text-primary font-label-sm text-label-sm underline hover:text-secondary"
          >
            {t("Manage groups")}
          </Link>
        </div>
        <div className="bg-surface-container-lowest border border-outline-variant/80 rounded-[16px] p-lg shadow-level-1">
          <p className="font-label-sm text-label-sm text-balance-owed uppercase tracking-wider">
            {t("You are owed")}
          </p>
          {emailConfirmed && totalsByCurrency.some((t) => t.owed > 0) ? (
            <ul className="mt-sm space-y-xs">
              {totalsByCurrency
                .filter((t) => t.owed > 0)
                .map((t) => (
                <li
                  key={t.currency}
                  className="font-financial-xl text-financial-xl text-balance-owed"
                >
                  {formatMoney(t.currency, t.owed)}
                </li>
              ))}
            </ul>
          ) : (
            <h3 className="font-financial-xl text-financial-xl text-on-surface-variant mt-sm">
              {emailConfirmed ? "—" : "—"}
            </h3>
          )}
          <p className="font-label-sm text-label-sm text-on-surface-variant mt-xl">
            {t("Totals by currency across groups")}
          </p>
        </div>
        <div className="bg-surface-container-lowest border border-outline-variant/80 rounded-[16px] p-lg shadow-level-1">
          <p className="font-label-sm text-label-sm text-balance-owe uppercase tracking-wider">
            {t("You owe")}
          </p>
          {emailConfirmed && totalsByCurrency.some((t) => t.owe > 0) ? (
            <ul className="mt-sm space-y-xs">
              {totalsByCurrency
                .filter((t) => t.owe > 0)
                .map((t) => (
                <li
                  key={t.currency}
                  className="font-financial-xl text-financial-xl text-balance-owe"
                >
                  {formatMoney(t.currency, t.owe)}
                </li>
              ))}
            </ul>
          ) : (
            <h3 className="font-financial-xl text-financial-xl text-on-surface-variant mt-sm">
              {emailConfirmed ? "—" : "—"}
            </h3>
          )}
          <Link
            href="/settlements"
            className="mt-xl text-primary font-label-sm text-label-sm underline hover:text-secondary inline-block"
          >
            {t("Settle up")}
          </Link>
        </div>
      </div>

      <div className="bg-surface-container-lowest border border-outline-variant/80 rounded-[16px] shadow-level-1 overflow-hidden">
        <div className="p-lg border-b border-outline-variant flex justify-between items-center gap-md flex-wrap">
          <h3 className="font-headline-md text-headline-md text-on-surface">
            {t("Per-group balances")}
          </h3>
          <Link
            href="/groups"
            className="text-secondary font-label-sm text-label-sm hover:underline shrink-0"
          >
            {t("Groups")}
          </Link>
        </div>
        {!emailConfirmed || balances === null ? (
          <p className="p-lg font-body-md text-on-surface-variant">
            {emailConfirmed ? t("Loading…") : "—"}
          </p>
        ) : balances.length === 0 ? (
          <p className="p-lg font-body-md text-on-surface-variant">
            {t("Join a group to see how much you owe and are owed.")}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left font-body-md">
              <thead>
                <tr className="border-b border-outline-variant/60 text-label-sm text-on-surface-variant uppercase tracking-wider">
                  <th className="p-md font-label-sm">{t("Group")}</th>
                  <th className="p-md font-label-sm text-right text-balance-owe">
                    {t("You owe")}
                  </th>
                  <th className="p-md font-label-sm text-right text-balance-owed">
                    {t("You are owed")}
                  </th>
                  <th className="p-md font-label-sm w-px whitespace-nowrap" />
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/40">
                {balances.map((row) => (
                  <tr key={row.groupId} className="text-on-surface">
                    <td className="p-md font-semibold">{row.groupName}</td>
                    <td
                      className={`p-md text-right tabular-nums ${
                        row.youOwe > 0 ? oweAmountClass(row.youOwe) : "text-on-surface-variant"
                      }`}
                    >
                      {row.youOwe > 0
                        ? formatMoney(row.currency, row.youOwe)
                        : "—"}
                    </td>
                    <td
                      className={`p-md text-right tabular-nums ${
                        row.youAreOwed > 0
                          ? owedAmountClass(row.youAreOwed)
                          : "text-on-surface-variant"
                      }`}
                    >
                      {row.youAreOwed > 0
                        ? formatMoney(row.currency, row.youAreOwed)
                        : "—"}
                    </td>
                    <td className="p-md">
                      <Link
                        href={`/expenses?group=${encodeURIComponent(row.groupId)}`}
                        className="text-secondary font-label-sm hover:underline whitespace-nowrap"
                      >
                        {t("Expenses")}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="bg-surface-container-lowest border border-outline-variant/80 rounded-2xl shadow-level-1 flex flex-col overflow-hidden">
        <div className="p-lg border-b border-outline-variant flex justify-between items-center gap-md flex-wrap bg-surface-container-low/50">
          <div>
            <h3 className="font-headline-md text-headline-md text-on-surface">
              {t("Recent activity")}
            </h3>
            <p className="font-label-sm text-on-surface-variant mt-xs">
              {t("Expenses and settlements, newest first")}
            </p>
          </div>
          <Link
            href="/expenses"
            className="text-secondary font-label-sm text-label-sm hover:underline shrink-0 inline-flex items-center gap-xs"
          >
            <span className="material-symbols-outlined text-[18px]">open_in_new</span>
            {t("All activity")}
          </Link>
        </div>
        {!emailConfirmed || activity === null ? (
          <p className="p-lg font-body-md text-on-surface-variant">
            {emailConfirmed ? t("Loading…") : "—"}
          </p>
        ) : activity.length === 0 ? (
          <p className="p-lg font-body-md text-on-surface-variant">
            {t("No transactions or settlements yet in your groups.")}
          </p>
        ) : (
          <ul className="flex flex-col gap-sm p-sm sm:p-md">
            {activity.map((item) => (
              <DashboardActivityRow
                key={`${item.kind}-${item.id}`}
                item={item}
                profileId={profile?.id}
                locale={locale}
                t={t}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
