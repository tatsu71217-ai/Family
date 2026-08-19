"use client";

import * as React from "react";
import { relationStatusMap } from "@/lib/constants";
import type { FamilyMember, Relationship } from "@/lib/types";
import { clamp, cn } from "@/lib/utils";

export interface MapNode {
  id: string;
  x: number;
  y: number;
}

const WIDTH = 720;
const HEIGHT = 900;
const NODE_R = 34;

const POSITIONS_KEY = "kazoku-map:node-positions:v1";

/** 自分を中心に、ほかの家族を円形に配置する初期レイアウト。 */
export function defaultLayout(members: FamilyMember[]): Record<string, MapNode> {
  const positions: Record<string, MapNode> = {};
  const self = members.find((m) => m.isSelf);
  const others = members.filter((m) => m.id !== self?.id);
  const cx = WIDTH / 2;
  const cy = HEIGHT / 2;

  if (self) positions[self.id] = { id: self.id, x: cx, y: cy };

  // 横は画面幅に収め、縦は少し広げて名前が重なりにくいようにする
  const radiusX = others.length <= 4 ? 215 : others.length <= 7 ? 250 : 280;
  const radiusY = radiusX * 1.25;
  others.forEach((member, index) => {
    const angle = (index / Math.max(others.length, 1)) * Math.PI * 2 - Math.PI / 2;
    positions[member.id] = {
      id: member.id,
      x: cx + Math.cos(angle) * radiusX,
      y: cy + Math.sin(angle) * radiusY,
    };
  });

  return positions;
}

/** 保存済みの位置があればそれを、無ければ初期レイアウトを使う。 */
function layoutWithSaved(members: FamilyMember[]): Record<string, MapNode> {
  const saved = loadSavedPositions();
  const base = defaultLayout(members);
  const merged: Record<string, MapNode> = {};
  for (const member of members) {
    const savedPos = saved[member.id];
    merged[member.id] = savedPos
      ? { id: member.id, x: savedPos.x, y: savedPos.y }
      : base[member.id];
  }
  return merged;
}

function loadSavedPositions(): Record<string, { x: number; y: number }> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.localStorage.getItem(POSITIONS_KEY) ?? "{}");
  } catch {
    return {};
  }
}

function savePositions(positions: Record<string, MapNode>) {
  if (typeof window === "undefined") return;
  const plain = Object.fromEntries(
    Object.values(positions).map((n) => [n.id, { x: Math.round(n.x), y: Math.round(n.y) }]),
  );
  window.localStorage.setItem(POSITIONS_KEY, JSON.stringify(plain));
}

const DASH: Record<string, string | undefined> = {
  good: undefined,
  normal: undefined,
  distant: "10 9",
  tense: "2 7",
  complex: "16 6 3 6",
  unknown: "4 8",
};

export function RelationMap({
  members,
  relationships,
  selectedId,
  onSelectMember,
  onSelectRelationship,
  className,
}: {
  members: FamilyMember[];
  relationships: Relationship[];
  selectedId: string | null;
  onSelectMember: (id: string | null) => void;
  onSelectRelationship: (relationship: Relationship) => void;
  className?: string;
}) {
  const svgRef = React.useRef<SVGSVGElement>(null);
  const [view, setView] = React.useState({ x: 0, y: 0, scale: 1 });

  // 人が増減したら、保存済みの位置を活かしつつ足りない分を配置し直す。
  // このコンポーネントはデータ取得後にしか描画されないので、初期値の計算で保存値を読んで問題ない。
  const membersKey = members.map((m) => `${m.id}:${m.isSelf ? 1 : 0}`).join(",");
  const [positions, setPositions] = React.useState<Record<string, MapNode>>(() =>
    layoutWithSaved(members),
  );
  const [lastMembersKey, setLastMembersKey] = React.useState(membersKey);
  if (lastMembersKey !== membersKey) {
    setLastMembersKey(membersKey);
    setPositions(layoutWithSaved(members));
  }

  const pointers = React.useRef(new Map<number, { x: number; y: number }>());
  const dragging = React.useRef<
    | { type: "node"; id: string; offsetX: number; offsetY: number }
    | { type: "pan"; startX: number; startY: number; originX: number; originY: number }
    | null
  >(null);
  const pinchStart = React.useRef<{ distance: number; scale: number } | null>(null);
  const moved = React.useRef(false);

  const toSvg = React.useCallback(
    (clientX: number, clientY: number) => {
      const rect = svgRef.current?.getBoundingClientRect();
      if (!rect) return { x: 0, y: 0 };
      const ratio = WIDTH / rect.width;
      const rawX = (clientX - rect.left) * ratio;
      const rawY = (clientY - rect.top) * (HEIGHT / rect.height);
      return { x: (rawX - view.x) / view.scale, y: (rawY - view.y) / view.scale };
    },
    [view],
  );

  function handlePointerDown(e: React.PointerEvent<SVGSVGElement>) {
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    moved.current = false;
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      pinchStart.current = { distance: Math.hypot(a.x - b.x, a.y - b.y), scale: view.scale };
      dragging.current = null;
      return;
    }
    const target = (e.target as Element).closest("[data-node-id]");
    (e.currentTarget as SVGSVGElement).setPointerCapture(e.pointerId);
    if (target) {
      const id = target.getAttribute("data-node-id")!;
      const point = toSvg(e.clientX, e.clientY);
      const node = positions[id];
      dragging.current = { type: "node", id, offsetX: point.x - node.x, offsetY: point.y - node.y };
    } else {
      dragging.current = {
        type: "pan",
        startX: e.clientX,
        startY: e.clientY,
        originX: view.x,
        originY: view.y,
      };
    }
  }

  function handlePointerMove(e: React.PointerEvent<SVGSVGElement>) {
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointers.current.size === 2 && pinchStart.current) {
      const [a, b] = [...pointers.current.values()];
      const distance = Math.hypot(a.x - b.x, a.y - b.y);
      const next = clamp((distance / pinchStart.current.distance) * pinchStart.current.scale, 0.5, 2.4);
      setView((v) => ({ ...v, scale: next }));
      moved.current = true;
      return;
    }

    const drag = dragging.current;
    if (!drag) return;
    moved.current = true;

    if (drag.type === "node") {
      const point = toSvg(e.clientX, e.clientY);
      setPositions((current) => ({
        ...current,
        [drag.id]: {
          id: drag.id,
          x: clamp(point.x - drag.offsetX, NODE_R, WIDTH - NODE_R),
          y: clamp(point.y - drag.offsetY, NODE_R, HEIGHT - NODE_R),
        },
      }));
    } else {
      const rect = svgRef.current?.getBoundingClientRect();
      const ratio = rect ? WIDTH / rect.width : 1;
      setView((v) => ({
        ...v,
        x: drag.originX + (e.clientX - drag.startX) * ratio,
        y: drag.originY + (e.clientY - drag.startY) * ratio,
      }));
    }
  }

  function handlePointerUp(e: React.PointerEvent<SVGSVGElement>) {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinchStart.current = null;
    if (dragging.current?.type === "node") savePositions(positions);
    if (!moved.current && dragging.current?.type === "pan") onSelectMember(null);
    dragging.current = null;
  }

  function handleWheel(e: React.WheelEvent<SVGSVGElement>) {
    if (!e.ctrlKey && Math.abs(e.deltaY) < 2) return;
    setView((v) => ({ ...v, scale: clamp(v.scale - e.deltaY * 0.0015, 0.5, 2.4) }));
  }

  function resetView() {
    setView({ x: 0, y: 0, scale: 1 });
    const base = defaultLayout(members);
    setPositions(base);
    savePositions(base);
  }

  const nodeById = positions;

  return (
    <div className={cn("relative overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface", className)}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="h-full w-full touch-none select-none"
        role="img"
        aria-label="家族の関係マップ"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onWheel={handleWheel}
      >
        <defs>
          <pattern id="map-dots" width="28" height="28" patternUnits="userSpaceOnUse">
            <circle cx="1.5" cy="1.5" r="1.5" fill="#f0eae1" />
          </pattern>
        </defs>
        <rect width={WIDTH} height={HEIGHT} fill="url(#map-dots)" />

        <g transform={`translate(${view.x} ${view.y}) scale(${view.scale})`}>
          {relationships.map((relationship) => {
            const a = nodeById[relationship.memberAId];
            const b = nodeById[relationship.memberBId];
            if (!a || !b) return null;
            const option = relationStatusMap[relationship.status];
            const midX = (a.x + b.x) / 2;
            const midY = (a.y + b.y) / 2;
            return (
              <g key={relationship.id}>
                <line
                  x1={a.x}
                  y1={a.y}
                  x2={b.x}
                  y2={b.y}
                  stroke={option.color}
                  strokeWidth={relationship.status === "good" ? 4 : 3}
                  strokeLinecap="round"
                  strokeDasharray={DASH[relationship.status]}
                  opacity={
                    selectedId &&
                    relationship.memberAId !== selectedId &&
                    relationship.memberBId !== selectedId
                      ? 0.22
                      : 0.95
                  }
                />
                <circle
                  cx={midX}
                  cy={midY}
                  r={15}
                  fill="#ffffff"
                  stroke={option.color}
                  strokeWidth={2}
                  className="cursor-pointer"
                  onClick={() => onSelectRelationship(relationship)}
                />
                <text
                  x={midX}
                  y={midY + 5}
                  textAnchor="middle"
                  fontSize="14"
                  className="pointer-events-none select-none"
                >
                  {option.emoji}
                </text>
              </g>
            );
          })}

          {members.map((member) => {
            const node = nodeById[member.id];
            if (!node) return null;
            const active = selectedId === member.id;
            return (
              <g
                key={member.id}
                data-node-id={member.id}
                className="cursor-grab active:cursor-grabbing"
                onClick={() => {
                  if (!moved.current) onSelectMember(active ? null : member.id);
                }}
                opacity={selectedId && !active && !isConnected(relationships, selectedId, member.id) ? 0.35 : 1}
              >
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={NODE_R}
                  fill="#ffffff"
                  stroke={active ? "#5d8b72" : member.isSelf ? "#7fa88e" : "#ece5db"}
                  strokeWidth={active ? 4 : member.isSelf ? 3 : 2}
                />
                <text
                  x={node.x}
                  y={node.y + 9}
                  textAnchor="middle"
                  fontSize="26"
                  className="pointer-events-none select-none"
                >
                  {member.avatar}
                </text>
                <text
                  x={node.x}
                  y={node.y + NODE_R + 20}
                  textAnchor="middle"
                  fontSize="15"
                  fontWeight="600"
                  fill="#3d3733"
                  stroke="#fbf8f4"
                  strokeWidth="4"
                  paintOrder="stroke"
                  className="pointer-events-none select-none"
                >
                  {member.name}
                </text>
                {member.relation && member.relation !== member.name ? (
                  <text
                    x={node.x}
                    y={node.y + NODE_R + 37}
                    textAnchor="middle"
                    fontSize="12"
                    fill="#9a938b"
                    stroke="#fbf8f4"
                    strokeWidth="3.5"
                    paintOrder="stroke"
                    className="pointer-events-none select-none"
                  >
                    {member.relation}
                  </text>
                ) : null}
              </g>
            );
          })}
        </g>
      </svg>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between p-3">
        <p className="pointer-events-none rounded-full bg-surface/85 px-3 py-1 text-[11px] text-ink-faint">
          ドラッグで移動・2本指で拡大
        </p>
        <div className="pointer-events-auto flex gap-1.5">
          <MapButton label="縮小" onClick={() => setView((v) => ({ ...v, scale: clamp(v.scale - 0.2, 0.5, 2.4) }))}>
            −
          </MapButton>
          <MapButton label="拡大" onClick={() => setView((v) => ({ ...v, scale: clamp(v.scale + 0.2, 0.5, 2.4) }))}>
            ＋
          </MapButton>
          <MapButton label="配置を戻す" onClick={resetView}>
            ⟲
          </MapButton>
        </div>
      </div>
    </div>
  );
}

function MapButton({
  children,
  label,
  onClick,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="grid size-10 place-items-center rounded-full border border-line bg-surface text-base text-ink-soft shadow-sm hover:bg-paper-deep"
    >
      {children}
    </button>
  );
}

function isConnected(relationships: Relationship[], a: string, b: string) {
  return relationships.some(
    (r) =>
      (r.memberAId === a && r.memberBId === b) || (r.memberAId === b && r.memberBId === a),
  );
}
