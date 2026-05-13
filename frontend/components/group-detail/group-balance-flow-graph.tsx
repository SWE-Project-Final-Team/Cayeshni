"use client";

import { useCallback, useId, useMemo, useState } from "react";
import type { GraphMember } from "@/components/group-detail/transaction-split-graph";
import type { TransferEdge } from "@/lib/group-net-balances";

const W = 960;
const H = 720;
const NODE_R = 48;

type Props = {
  members: GraphMember[];
  edges: TransferEdge[];
  currencyLabel: string;
  focusUserId: string | null;
  onFocusUser: (userId: string | null) => void;
};

function shortenLine(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  r1: number,
  r2: number,
  curveBias: number
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
  const perpX = -uy;
  const perpY = ux;
  const mx = (sx1 + sx2) / 2 + perpX * (44 + curveBias);
  const my = (sy1 + sy2) / 2 + perpY * (44 + curveBias);
  return { sx1, sy1, sx2, sy2, mx, my };
}

export function GroupBalanceFlowGraph({
  members,
  edges,
  currencyLabel,
  focusUserId,
  onFocusUser,
}: Props) {
  const reactId = useId().replace(/:/g, "");
  const markerId = `${reactId}-flow-arrow`;
  const [hoverUser, setHoverUser] = useState<string | null>(null);
  const [hoverEdge, setHoverEdge] = useState<string | null>(null);
  const [avatarFailed, setAvatarFailed] = useState<ReadonlySet<string>>(() => new Set());

  const positions = useMemo(() => {
    const pos = new Map<string, { x: number; y: number }>();
    const n = members.length;
    if (n === 0) return pos;
    const cx = W / 2;
    const cy = H / 2;
    const radius = Math.min(W, H) * 0.36;
    members.forEach((m, i) => {
      const t = -Math.PI / 2 + (i / n) * Math.PI * 2;
      pos.set(m.userId, {
        x: cx + radius * Math.cos(t),
        y: cy + radius * Math.sin(t),
      });
    });
    return pos;
  }, [members]);

  const drawnEdges = useMemo(() => {
    return edges
      .map((e, idx) => {
        const p0 = positions.get(e.from);
        const p1 = positions.get(e.to);
        if (!p0 || !p1) return null;
        const curveBias = (idx % 7) * 6 - 18;
        const { sx1, sy1, sx2, sy2, mx, my } = shortenLine(
          p0.x,
          p0.y,
          p1.x,
          p1.y,
          NODE_R,
          NODE_R,
          curveBias
        );
        const path = `M ${sx1} ${sy1} Q ${mx} ${my} ${sx2} ${sy2}`;
        return {
          key: `${e.from}-${e.to}-${idx}`,
          from: e.from,
          to: e.to,
          amount: e.amount,
          path,
          mx,
          my,
        };
      })
      .filter(Boolean) as {
      key: string;
      from: string;
      to: string;
      amount: number;
      path: string;
      mx: number;
      my: number;
    }[];
  }, [edges, positions]);

  const nameFor = useCallback(
    (id: string) => members.find((m) => m.userId === id)?.displayName ?? id.slice(0, 8),
    [members]
  );

  const edgeVisual = useCallback(
    (e: (typeof drawnEdges)[0]) => {
      if (hoverEdge) {
        return {
          opacity: hoverEdge === e.key ? 1 : 0.14,
          strokeW: hoverEdge === e.key ? 4 : 1.4,
        };
      }
      if (hoverUser) {
        const hit = e.from === hoverUser || e.to === hoverUser;
        return {
          opacity: hit ? 1 : 0.14,
          strokeW: hit ? 3.6 : 1.4,
        };
      }
      if (focusUserId) {
        const em = e.from === focusUserId || e.to === focusUserId;
        return {
          opacity: em ? 1 : 0.12,
          strokeW: em ? 4 : 1.5,
        };
      }
      return { opacity: 0.92, strokeW: 2.6 };
    },
    [focusUserId, hoverEdge, hoverUser]
  );

  const nodeEmphasis = useCallback(
    (uid: string) => {
      if (hoverEdge) {
        const ed = drawnEdges.find((x) => x.key === hoverEdge);
        if (!ed) return 0.35;
        return ed.from === uid || ed.to === uid ? 1 : 0.28;
      }
      if (hoverUser) {
        return drawnEdges.some(
          (ed) =>
            (ed.from === uid || ed.to === uid) &&
            (ed.from === hoverUser || ed.to === hoverUser)
        )
          ? 1
          : 0.3;
      }
      if (focusUserId) {
        const anyEdge = drawnEdges.some(
          (ed) => ed.from === focusUserId || ed.to === focusUserId
        );
        if (!anyEdge) return 1;
        return drawnEdges.some(
          (ed) =>
            (ed.from === uid || ed.to === uid) &&
            (ed.from === focusUserId || ed.to === focusUserId)
        )
          ? 1
          : 0.32;
      }
      return 1;
    },
    [drawnEdges, focusUserId, hoverEdge, hoverUser]
  );

  function onNodeClick(uid: string) {
    onFocusUser(focusUserId === uid ? null : uid);
  }

  return (
    <div
      className="relative w-full min-w-0 rounded-2xl border border-outline-variant/90 shadow-[0_12px_40px_rgba(0,0,0,0.1)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.35)] bg-surface-container-lowest outline-none overflow-visible"
      tabIndex={0}
      onKeyDown={(ev) => {
        if (ev.key === "Escape") onFocusUser(null);
      }}
    >
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.18]"
        style={{
          background:
            "radial-gradient(ellipse 65% 50% at 50% 45%, var(--color-secondary-fixed) 0%, transparent 58%), radial-gradient(ellipse 45% 42% at 12% 88%, var(--color-primary-fixed) 0%, transparent 55%)",
        }}
      />

      <div className="relative z-[1] flex w-full min-w-0 flex-col gap-sm px-md pt-md pb-0 sm:flex-row sm:items-start sm:justify-between sm:gap-md sm:px-xl pointer-events-none">
        <div className="min-w-0 flex-1 pr-0 sm:pr-md">
          <p className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">
            Whole group
          </p>
          <p className="font-headline-sm text-on-surface mt-xs tabular-nums">{currencyLabel}</p>
          <p className="font-body-md text-on-surface-variant mt-xs w-full max-w-full text-pretty sm:max-w-[42rem]">
            Net balances from every expense and settlement. Arrows point to who is owed. Tap a
            person to highlight their transfers; tap empty space to clear (Esc).
          </p>
        </div>
        <div className="rounded-full border border-outline-variant/70 bg-surface/85 backdrop-blur-sm px-sm py-xs font-label-sm text-on-surface-variant shrink-0 self-start sm:self-auto pointer-events-auto">
          {edges.length === 0
            ? "Everyone settled up"
            : `${edges.length} transfer${edges.length === 1 ? "" : "s"}`}
        </div>
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="xMidYMid meet"
        overflow="visible"
        className="relative z-[1] block h-auto w-full min-w-0 max-w-full select-none"
        style={{ minHeight: 360 }}
        role="img"
        aria-label="Group balance flow between members"
      >
        <rect
          x={0}
          y={0}
          width={W}
          height={H}
          fill="transparent"
          className="cursor-default"
          onClick={() => onFocusUser(null)}
        />

        <defs>
          <marker
            id={markerId}
            markerWidth="10"
            markerHeight="10"
            refX="9"
            refY="5"
            orient="auto"
            markerUnits="strokeWidth"
          >
            <path d="M0,0 L0,10 L10,5 z" fill="var(--color-balance-owe)" />
          </marker>
        </defs>

        {drawnEdges.map((e) => {
          const v = edgeVisual(e);
          return (
            <g key={e.key}>
              <path
                d={e.path}
                fill="none"
                strokeWidth={v.strokeW}
                stroke="var(--color-balance-owe)"
                strokeLinecap="round"
                className="transition-all duration-200 cursor-pointer"
                style={{ opacity: v.opacity }}
                markerEnd={`url(#${markerId})`}
                onMouseEnter={() => setHoverEdge(e.key)}
                onMouseLeave={() => setHoverEdge(null)}
                onClick={(ev) => ev.stopPropagation()}
              />
              <rect
                x={e.mx - 58}
                y={e.my - 16}
                width={116}
                height={32}
                rx="12"
                fill="var(--color-surface-container-highest)"
                stroke="var(--color-balance-owe)"
                strokeOpacity={0.35}
                className="cursor-pointer transition-all duration-200"
                strokeWidth={1}
                style={{ opacity: v.opacity }}
                onMouseEnter={() => setHoverEdge(e.key)}
                onMouseLeave={() => setHoverEdge(null)}
                onClick={(ev) => ev.stopPropagation()}
              />
              <text
                x={e.mx}
                y={e.my + 5}
                textAnchor="middle"
                className="text-[12px] font-bold tabular-nums pointer-events-none"
                fill="var(--color-balance-owe)"
                style={{ opacity: v.opacity }}
              >
                {currencyLabel} {e.amount.toFixed(2)}
              </text>
            </g>
          );
        })}

        {members.map((m) => {
          const p = positions.get(m.userId);
          if (!p) return null;
          const op = nodeEmphasis(m.userId);
          const selected = focusUserId === m.userId;
          const avatar = m.avatarUrl?.trim();
          const showPhoto = Boolean(avatar) && !avatarFailed.has(m.userId);
          const initials = m.displayName.slice(0, 2).toUpperCase();
          const maskId = `${reactId}-mask-${m.userId}`;

          return (
            <g
              key={m.userId}
              transform={`translate(${p.x}, ${p.y})`}
              style={{ opacity: op }}
              className="cursor-pointer transition-opacity duration-200"
              onMouseEnter={() => setHoverUser(m.userId)}
              onMouseLeave={() => setHoverUser(null)}
              onClick={(ev) => {
                ev.stopPropagation();
                onNodeClick(m.userId);
              }}
            >
              <defs>
                <mask
                  id={maskId}
                  maskUnits="userSpaceOnUse"
                  x={-NODE_R - 4}
                  y={-NODE_R - 4}
                  width={(NODE_R + 4) * 2}
                  height={(NODE_R + 4) * 2}
                >
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
                  onError={() => setAvatarFailed((prev) => new Set(prev).add(m.userId))}
                />
              ) : (
                <circle
                  r={NODE_R}
                  fill="var(--color-primary-fixed)"
                  className="pointer-events-none"
                />
              )}

              {!showPhoto ? (
                <text
                  y={7}
                  textAnchor="middle"
                  className="font-bold text-[15px] pointer-events-none"
                  fill="var(--color-on-surface)"
                >
                  {initials}
                </text>
              ) : null}

              <circle
                r={NODE_R}
                fill="none"
                stroke={
                  selected ? "var(--color-secondary)" : "var(--color-outline-variant)"
                }
                strokeWidth={selected ? 4 : 2.5}
                className="pointer-events-none"
                style={{
                  filter: selected
                    ? "drop-shadow(0 0 12px rgba(20,122,74,0.45))"
                    : "drop-shadow(0 2px 8px rgba(0,0,0,0.12))",
                }}
              />

              <text
                y={NODE_R + 28}
                textAnchor="middle"
                fill="var(--color-on-surface)"
                fontSize={m.displayName.length > 16 ? 10 : 12}
                fontWeight={600}
                className="pointer-events-none"
              >
                {m.displayName.length > 18
                  ? `${m.displayName.slice(0, 17)}…`
                  : m.displayName}
              </text>
            </g>
          );
        })}
      </svg>

      {(hoverUser || hoverEdge) && (
        <div className="sr-only" aria-live="polite">
          {hoverEdge
            ? (() => {
                const e = drawnEdges.find((x) => x.key === hoverEdge);
                return e
                  ? `${nameFor(e.from)} owes ${nameFor(e.to)} ${e.amount.toFixed(2)} ${currencyLabel}`
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
