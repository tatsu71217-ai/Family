"use client";

import {
  Area,
  AreaChart,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { TrendPoint } from "@/lib/insights";
import { EmptyState } from "@/components/ui/empty-state";

interface Slice {
  key: string;
  name: string;
  emoji: string;
  value: number;
  color: string;
  percent: number;
}

const axisStyle = { fontSize: 11, fill: "#9a938b" } as const;

/** 感情の割合。中央に合計を出して「何件から見ているか」を分かるようにする。 */
export function EmotionPie({ data }: { data: Slice[] }) {
  if (!data.length) {
    return (
      <EmptyState
        emoji="🫧"
        title="まだ感情の記録がありません"
        description="記録が増えると、どんな気持ちが多いかが割合で見えます。"
      />
    );
  }
  const total = data.reduce((sum, d) => sum + d.value, 0);
  // 棒の長さは、いちばん多い気持ちを基準にした相対的な長さで見せる
  const max = Math.max(...data.map((d) => d.value), 1);

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row">
      <div className="relative h-48 w-48 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius={54}
              outerRadius={82}
              paddingAngle={2}
              stroke="none"
              isAnimationActive={false}
            >
              {data.map((slice) => (
                <Cell key={slice.key} fill={slice.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value, name) => [`${String(value)}件`, String(name)]}
              contentStyle={tooltipStyle}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
          <div>
            <p className="text-xl font-semibold text-ink">{total}</p>
            <p className="text-[11px] text-ink-faint">件の記録</p>
          </div>
        </div>
      </div>

      <ul className="w-full space-y-1.5">
        {data.map((slice) => (
          <li key={slice.key} className="flex items-center gap-2 text-[13px]">
            <span aria-hidden className="w-5 text-center">
              {slice.emoji}
            </span>
            <span className="flex-1 text-ink">{slice.name}</span>
            <span className="text-ink-faint">{slice.percent}%</span>
            <span
              aria-hidden
              className="h-2 w-16 overflow-hidden rounded-full bg-paper-deep"
            >
              <span
                className="block h-full rounded-full"
                style={{
                  width: `${Math.max(12, (slice.value / max) * 100)}%`,
                  backgroundColor: slice.color,
                }}
              />
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

const tooltipStyle = {
  borderRadius: 14,
  border: "1px solid #ece5db",
  fontSize: 12,
  boxShadow: "0 4px 16px rgba(61,55,51,.08)",
} as const;

/** 感情の時間変化。「良い / 悪い」ではなく「あたたかい / 重い」で示す。 */
export function EmotionTrend({ data }: { data: TrendPoint[] }) {
  const hasData = data.some((point) => point.count > 0);
  if (!hasData) {
    return (
      <EmptyState
        emoji="📈"
        title="変化を見るには、もう少し記録が必要です"
        description="感情を数回記録すると、時間の流れとして表示されます。"
      />
    );
  }

  return (
    <div className="w-full">
      <div className="h-52 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
          <XAxis dataKey="label" tick={axisStyle} axisLine={false} tickLine={false} />
          <YAxis tick={axisStyle} axisLine={false} tickLine={false} allowDecimals={false} width={32} />
          <Tooltip
            contentStyle={tooltipStyle}
            formatter={(value, name) => [
              String(value),
              name === "warm" ? "あたたかい" : "重い",
            ]}
          />
          <Line
            type="monotone"
            dataKey="warm"
            stroke="#7fa88e"
            strokeWidth={3}
            dot={{ r: 3, fill: "#7fa88e", strokeWidth: 0 }}
            isAnimationActive={false}
          />
          <Line
            type="monotone"
            dataKey="heavy"
            stroke="#a99ac9"
            strokeWidth={3}
            dot={{ r: 3, fill: "#a99ac9", strokeWidth: 0 }}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
      </div>
      <div className="mt-3 flex justify-center gap-4 text-[12px] text-ink-soft">
        <span className="flex items-center gap-1.5">
          <span aria-hidden className="size-2.5 rounded-full bg-sage" /> あたたかい
        </span>
        <span className="flex items-center gap-1.5">
          <span aria-hidden className="size-2.5 rounded-full bg-lilac" /> 重い
        </span>
      </div>
    </div>
  );
}

/** ダッシュボードの「最近の変化」用の小さなグラフ。 */
export function MiniTrend({ data }: { data: TrendPoint[] }) {
  const hasData = data.some((point) => point.count > 0);
  if (!hasData) {
    return (
      <p className="py-4 text-center text-[13px] text-ink-faint">
        感情を記録すると、ここに流れが出ます。
      </p>
    );
  }
  return (
    <div className="h-24 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="warm-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#7fa88e" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#7fa88e" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="heavy-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#a99ac9" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#a99ac9" stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="warm"
            stroke="#7fa88e"
            strokeWidth={2.5}
            fill="url(#warm-fill)"
            isAnimationActive={false}
          />
          <Area
            type="monotone"
            dataKey="heavy"
            stroke="#a99ac9"
            strokeWidth={2.5}
            fill="url(#heavy-fill)"
            isAnimationActive={false}
          />
          <XAxis dataKey="label" tick={axisStyle} axisLine={false} tickLine={false} interval="preserveStartEnd" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
