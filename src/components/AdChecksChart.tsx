"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { AdCheck } from "@/lib/types";

export function AdChecksChart({ checks }: { checks: AdCheck[] }) {
  const data = [...checks]
    .sort((a, b) => a.at - b.at)
    .map((c) => ({
      date: new Date(c.at).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
      }),
      ativos: c.activeAds,
    }));

  const last = checks[checks.length - 1];
  const prev = checks[checks.length - 2];
  const trend =
    last && prev ? last.activeAds - prev.activeAds : 0;

  return (
    <div>
      <div className="mb-1 flex items-baseline gap-2">
        <span className="text-2xl font-bold">{last?.activeAds ?? 0}</span>
        <span className="text-xs text-muted">anúncios ativos</span>
        {trend !== 0 && (
          <span
            className={`text-xs font-medium ${trend > 0 ? "text-green-500" : "text-red-500"}`}
          >
            {trend > 0 ? "↑" : "↓"} {Math.abs(trend)}
          </span>
        )}
      </div>
      <div style={{ height: 120 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10, fill: "rgb(var(--muted))" }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fill: "rgb(var(--muted))" }}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
              width={28}
            />
            <Tooltip
              contentStyle={{
                background: "rgb(var(--surface))",
                border: "1px solid rgb(var(--border))",
                borderRadius: 8,
                fontSize: 12,
                color: "rgb(var(--fg))",
              }}
            />
            <Line
              type="monotone"
              dataKey="ativos"
              stroke="rgb(var(--brand))"
              strokeWidth={2}
              dot={{ r: 3 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
