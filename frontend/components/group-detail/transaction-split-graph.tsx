"use client";

import { useId, useMemo, useState } from "react";
import { useI18n } from "@/lib/i18n";

export type GraphMember = {
  userId: string;
  displayName: string;
  /** Resolved absolute URL (e.g. via `mediaUrl`); omit or null for initials fallback. */
  avatarUrl?: string | null;
};

type Props = {
  members: GraphMember[];
  paidByUserId: string;
  splits: { userId: string; amountOwed: number }[];
  currencyLabel: string;
  /** If set, shown under payer node instead of deriving from splits (e.g. original share while edges use remaining). */
  payerShareAmount?: number | null;
  /** Dim styling when another panel highlights */
  activeUserIds?: ReadonlySet<string> | null;
  /** Highlight flows from this member's perspective (payer vs share). */
  lensUserId?: string | null;
  /** Fired when a member bubble is clicked (not edges). */
  onMemberClick?: (userId: string) => void;
  /** Smaller canvas for dense layouts */
  compact?: boolean;
};

function shortenLine(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  r1: number,
  r2: number
): { sx1: number; sy1: number; sx2: number; sy2: number; mx: number; my: number } {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  const sx1 = x1 + ux * r1;
  const sy1 = y1 + uy * r1;
  const sx2 = x2 - ux * r2;
  const sy2 = y2 - uy * r2;
  const mx = (sx1 + sx2) / 2 + uy * 32 * (Math.abs(ux) < 0.35 ? 0.65 : 1);
  const my = (sy1 + sy2) / 2 - ux * 32 * (Math.abs(uy) < 0.35 ? 0.65 : 1);
  return { sx1, sy1, sx2, sy2, mx, my };
}

export function TransactionSplitGraph({
  members,
  paidByUserId,
  splits,
  currencyLabel,
  payerShareAmount,
  activeUserIds,
  lensUserId,
  onMemberClick,
  compact,
}: Props) {
  const { t } = useI18n();
  const reactId = useId().replace(/:/g, "");
  const markerId = `${reactId}-split-arrow`;
  const markerOwedId = `${reactId}-split-arrow-owed`;
  const [hoverUser, setHoverUser] = useState<string | null>(null);
  const [hoverEdge, setHoverEdge] = useState<string | null>(null);
  const [avatarFailed, setAvatarFailed] = useState<ReadonlySet<string>>(() => new Set());

  const { W, H, NODE_R } = useMemo(
    () =>
      compact
        ? { W: 520, H: 364, NODE_R: 32 }
        : { W: 680, H: 468, NODE_R: 40 },
    [compact]
  );

  const { positions, edges } = useMemo(() => {
    const pos = new Map<string, { x: number; y: number }>();
    const payerX = W / 2;
    const payerY = compact ? 60 : 84;
    pos.set(paidByUserId, { x: payerX, y: payerY });

    const others = members
      .map((m) => m.userId)
      .filter((id) => id !== paidByUserId);
    const n = Math.max(others.length, 1);
    others.forEach((uid, i) => {
      const t = n === 1 ? 0.5 : i / (n - 1);
      const x = W * (0.1 + 0.8 * t);
      const y = H - (compact ? 94 : 112);
      pos.set(uid, { x, y });
    });

    const debtors = splits.filter(
      (s) => s.userId !== paidByUserId && s.amountOwed > 0
    );

    const edgeList: {
      key: string;
      from: string;
      to: string;
      amount: number;
      x1: number;
      y1: number;
      x2: number;
      y2: number;
      mx: number;
      my: number;
      path: string;
    }[] = [];

    for (const d of debtors) {
      const p0 = pos.get(paidByUserId);
      const p1 = pos.get(d.userId);
      if (!p0 || !p1) continue;
      const { sx1, sy1, sx2, sy2, mx, my } = shortenLine(
        p0.x,
        p0.y,
        p1.x,
        p1.y,
        NODE_R,
        NODE_R
      );
      const path = `M ${sx1} ${sy1} Q ${mx} ${my} ${sx2} ${sy2}`;
      edgeList.push({
        key: `${paidByUserId}-${d.userId}-${d.amountOwed}`,
        from: paidByUserId,
        to: d.userId,
        amount: d.amountOwed,
        x1: sx1,
        y1: sy1,
        x2: sx2,
        y2: sy2,
        mx,
        my,
        path,
      });
    }

    return { positions: pos, edges: edgeList };
  }, [members, paidByUserId, splits, W, H, NODE_R, compact]);

  function edgeStroke(e: (typeof edges)[0]): string {
    if (!lensUserId) return "var(--color-balance-owe)";
    if (lensUserId === paidByUserId) return "var(--color-balance-owed)";
    if (e.to === lensUserId) return "var(--color-balance-owe)";
    return "var(--color-outline-variant)";
  }

  function edgeMarkerEnd(e: (typeof edges)[0]): string {
    const stroke = edgeStroke(e);
    return stroke.includes("balance-owed") ? markerOwedId : markerId;
  }

  function edgeStrokeWidth(e: (typeof edges)[0]): number {
    if (!lensUserId) return hoverEdge === e.key ? 3.4 : 2.4;
    if (lensUserId === paidByUserId) return hoverEdge === e.key ? 4 : 3;
    if (e.to === lensUserId) return hoverEdge === e.key ? 4 : 3.2;
    return hoverEdge === e.key ? 2.2 : 1.6;
  }

  function nameFor(id: string): string {
    return members.find((m) => m.userId === id)?.displayName ?? id.slice(0, 8);
  }

  function nodeOpacity(uid: string): number {
    if (!hoverUser && !hoverEdge && (!activeUserIds || activeUserIds.size === 0)) {
      if (lensUserId) {
        const rel = new Set<string>([paidByUserId, lensUserId]);
        for (const ed of edges) {
          if (ed.to === lensUserId || ed.from === lensUserId) {
            rel.add(ed.from);
            rel.add(ed.to);
          }
        }
        return rel.has(uid) ? 1 : 0.32;
      }
      return 1;
    }
    if (hoverEdge) {
      const e = edges.find((x) => x.key === hoverEdge);
      if (!e) return 0.35;
      return e.from === uid || e.to === uid ? 1 : 0.3;
    }
    if (hoverUser) {
      const related = new Set<string>([paidByUserId]);
      for (const ed of edges) {
        if (ed.from === hoverUser || ed.to === hoverUser) {
          related.add(ed.from);
          related.add(ed.to);
        }
      }
      return related.has(uid) ? 1 : 0.3;
    }
    if (activeUserIds?.size) {
      return activeUserIds.has(uid) ? 1 : 0.35;
    }
    return 1;
  }

  function edgeOpacity(e: (typeof edges)[0]): number {
    if (hoverEdge) return e.key === hoverEdge ? 1 : 0.2;
    if (hoverUser) {
      return e.from === hoverUser || e.to === hoverUser ? 1 : 0.2;
    }
    if (activeUserIds?.size) {
      return activeUserIds.has(e.from) && activeUserIds.has(e.to) ? 1 : 0.25;
    }
    if (lensUserId) {
      if (lensUserId === paidByUserId) return 1;
      if (e.to === lensUserId) return 1;
      return 0.2;
    }
    return 0.88;
  }

  const payerSplit =
    payerShareAmount != null
      ? payerShareAmount
      : splits.find((s) => s.userId === paidByUserId)?.amountOwed ?? 0;

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-outline-variant/90 shadow-[0_8px_32px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.35)]">
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.22]"
        style={{
          background:
            "radial-gradient(ellipse 70% 45% at 50% 12%, var(--color-secondary) 0%, transparent 62%), radial-gradient(ellipse 50% 40% at 80% 90%, var(--color-primary-fixed) 0%, transparent 50%)",
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.06]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(128,128,128,0.35) 1px, transparent 1px), linear-gradient(90deg, rgba(128,128,128,0.35) 1px, transparent 1px)",
          backgroundSize: "20px 20px",
        }}
      />

      <div className="relative z-[1] px-md pt-md pb-0 sm:px-lg">
        <p className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">
          {t("Split flow")}
        </p>
        <p className="font-headline-sm text-on-surface mt-xs tabular-nums">{currencyLabel}</p>
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="relative z-[1] w-full h-auto block select-none"
        style={{ minHeight: compact ? 232 : 308 }}
        role="img"
        aria-label={t("Expense split from payer to members")}
      >
        <defs>
          <marker
            id={markerId}
            markerWidth="9"
            markerHeight="9"
            refX="8"
            refY="4.5"
            orient="auto"
            markerUnits="strokeWidth"
          >
            <path d="M0,0 L0,9 L9,4.5 z" fill="var(--color-balance-owe)" />
          </marker>
          <marker
            id={markerOwedId}
            markerWidth="9"
            markerHeight="9"
            refX="8"
            refY="4.5"
            orient="auto"
            markerUnits="strokeWidth"
          >
            <path d="M0,0 L0,9 L9,4.5 z" fill="var(--color-balance-owed)" />
          </marker>
          <filter id={`${reactId}-glow`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {edges.map((e) => (
          <g key={e.key}>
            <path
              d={e.path}
              fill="none"
              strokeWidth={edgeStrokeWidth(e)}
              stroke={edgeStroke(e)}
              strokeLinecap="round"
              className="transition-all duration-150 cursor-pointer"
              style={{ opacity: edgeOpacity(e) }}
              markerEnd={`url(#${edgeMarkerEnd(e)})`}
              filter={hoverEdge === e.key ? `url(#${reactId}-glow)` : undefined}
              onMouseEnter={() => setHoverEdge(e.key)}
              onMouseLeave={() => setHoverEdge(null)}
            />
            <rect
              x={e.mx - 54}
              y={e.my - 15}
              width={108}
              height={30}
              rx="10"
              fill="var(--color-surface-container-highest)"
              stroke={edgeStroke(e)}
              strokeOpacity={hoverEdge === e.key ? 0.55 : 0.28}
              className="cursor-pointer transition-all duration-150"
              strokeWidth={hoverEdge === e.key ? 1.5 : 1}
              style={{
                opacity: edgeOpacity(e),
                filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.12))",
              }}
              onMouseEnter={() => setHoverEdge(e.key)}
              onMouseLeave={() => setHoverEdge(null)}
            />
            <text
              x={e.mx}
              y={e.my + 5}
              textAnchor="middle"
              className="text-[11px] font-bold tabular-nums pointer-events-none"
              fill={edgeStroke(e)}
              style={{ opacity: edgeOpacity(e) }}
            >
              {currencyLabel} {e.amount.toFixed(2)}
            </text>
          </g>
        ))}

        {members.map((m) => {
          const p = positions.get(m.userId);
          if (!p) return null;
          const isPayer = m.userId === paidByUserId;
          const op = nodeOpacity(m.userId);
          const maskId = `${reactId}-mask-${m.userId}`;
          const avatar = m.avatarUrl?.trim();
          const showPhoto = Boolean(avatar) && !avatarFailed.has(m.userId);
          const initials = m.displayName.slice(0, 2).toUpperCase();

          const lensSelected = lensUserId && m.userId === lensUserId;

          return (
            <g
              key={m.userId}
              transform={`translate(${p.x}, ${p.y})`}
              style={{ opacity: op }}
              className="cursor-pointer transition-opacity duration-150"
              onMouseEnter={() => setHoverUser(m.userId)}
              onMouseLeave={() => setHoverUser(null)}
              onClick={(ev) => {
                ev.stopPropagation();
                onMemberClick?.(m.userId);
              }}
            >
              <defs>
                <mask id={maskId} maskUnits="userSpaceOnUse" x={-NODE_R - 2} y={-NODE_R - 2} width={(NODE_R + 2) * 2} height={(NODE_R + 2) * 2}>
                  <circle cx={0} cy={0} r={NODE_R} fill="white" />
                </mask>
              </defs>

              {showPhoto ? (
                <image
                  href={avatar}
                  x={-NODE_R}
                  y={-NODE_R}
                  width={NODE_R * 2}
                  height={NODE_R * 2}
                  preserveAspectRatio="xMidYMid slice"
                  mask={`url(#${maskId})`}
                  className="pointer-events-none"
                  onError={() =>
                    setAvatarFailed((prev) => new Set(prev).add(m.userId))
                  }
                />
              ) : (
                <circle
                  r={NODE_R}
                  fill={isPayer ? "var(--color-secondary)" : "var(--color-primary-fixed)"}
                  className="pointer-events-none"
                />
              )}

              {!showPhoto ? (
                <text
                  y={6}
                  textAnchor="middle"
                  className="font-bold text-[14px] pointer-events-none"
                  fill={isPayer ? "var(--color-on-secondary)" : "var(--color-on-surface)"}
                >
                  {initials}
                </text>
              ) : null}

              <circle
                r={NODE_R}
                fill="none"
                stroke={
                  lensSelected
                    ? "var(--color-secondary)"
                    : isPayer
                      ? "var(--color-on-secondary)"
                      : "var(--color-outline-variant)"
                }
                strokeWidth={lensSelected ? 4 : isPayer ? 3 : 2}
                style={{
                  filter: isPayer
                    ? "drop-shadow(0 0 10px rgba(0,0,0,0.2))"
                    : "drop-shadow(0 2px 6px rgba(0,0,0,0.1))",
                }}
                pointerEvents="none"
              />

              <text
                y={NODE_R + 24}
                textAnchor="middle"
                className="text-[11px] font-semibold pointer-events-none"
                fill="var(--color-on-surface)"
              >
                {m.displayName.length > 16
                  ? `${m.displayName.slice(0, 15)}…`
                  : m.displayName}
              </text>
              {isPayer ? (
                <text
                  y={-NODE_R - 10}
                  textAnchor="middle"
                  className="text-[10px] font-bold uppercase tracking-wide pointer-events-none"
                  fill="var(--color-secondary)"
                >
                  Paid
                </text>
              ) : null}
              {isPayer && payerSplit > 0 ? (
                <text
                  y={NODE_R + 40}
                  textAnchor="middle"
                  className="text-[10px] pointer-events-none"
                  fill="var(--color-on-surface-variant)"
                >
                  Own share {currencyLabel} {payerSplit.toFixed(2)}
                </text>
              ) : null}
              <circle
                r={NODE_R + 10}
                cx={0}
                cy={0}
                fill="transparent"
                pointerEvents="all"
                className="cursor-pointer"
                aria-hidden
              />
            </g>
          );
        })}
      </svg>

      {(hoverUser || hoverEdge) && (
        <div className="sr-only" aria-live="polite">
          {hoverEdge
            ? (() => {
                const e = edges.find((x) => x.key === hoverEdge);
                return e
                  ? `Owed ${e.amount.toFixed(2)} from ${nameFor(e.from)} to ${nameFor(e.to)}`
                  : "";
              })()
            : hoverUser
              ? `Member ${nameFor(hoverUser)}`
              : ""}
        </div>
      )}
    </div>
  );
}
