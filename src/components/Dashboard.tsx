"use client";

import { useEffect, useMemo } from "react";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
} from "recharts";
import { useStore } from "@/lib/store";
import { analyzePatterns } from "@/lib/aiService";
import {
  CREATIVE_TYPE_LABELS,
  LP_LABELS,
  STATUS_LABELS,
  STATUS_COLORS,
  OFFER_STATUSES,
  type Offer,
} from "@/lib/types";
import { EmptyState } from "./ui";

const PALETTE = ["#4f46e5", "#22c55e", "#f59e0b", "#3b82f6", "#ec4899", "#64748b"];

export function Dashboard() {
  const { offers, ready, init } = useStore();

  useEffect(() => {
    init();
  }, [init]);

  const data = useMemo(() => buildData(offers), [offers]);
  const patterns = useMemo(() => analyzePatterns(offers), [offers]);

  if (!ready) {
    return <div className="py-20 text-center text-muted">Carregando métricas…</div>;
  }
  if (offers.length === 0) {
    return (
      <EmptyState
        title="Sem dados ainda"
        subtitle="Salve algumas ofertas para ver métricas e padrões aqui."
      />
    );
  }

  const funnelMax = Math.max(...data.funnel.map((f) => f.value), 1);

  return (
    <div className="space-y-5">
      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Kpi label="Total de ofertas" value={offers.length} />
        <Kpi label="Score médio" value={data.avgScore} />
        <Kpi label="Salvas (30 dias)" value={data.last30} />
        <Kpi label="Escalando" value={data.byStatus.escalando ?? 0} accent />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Ofertas por semana */}
        <ChartCard title="Ofertas salvas por semana">
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={data.perWeek} margin={{ top: 5, right: 10, left: -18, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--border))" vertical={false} />
              <XAxis dataKey="week" tick={axisTick} tickLine={false} axisLine={false} />
              <YAxis tick={axisTick} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Area type="monotone" dataKey="count" stroke="#4f46e5" fill="#4f46e522" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Funil de status */}
        <ChartCard title="Funil de status">
          <div className="space-y-2.5 py-2">
            {data.funnel.map((f) => (
              <div key={f.status}>
                <div className="flex justify-between text-sm">
                  <span>{STATUS_LABELS[f.status]}</span>
                  <span className="font-medium">{f.value}</span>
                </div>
                <div className="mt-1 h-3 overflow-hidden rounded-full bg-surface-2">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${(f.value / funnelMax) * 100}%`,
                      backgroundColor: STATUS_COLORS[f.status],
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </ChartCard>

        {/* Distribuição por tipo de criativo */}
        <ChartCard title="Por tipo de criativo">
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={data.byCreative}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label={(e) => `${e.name}: ${e.value}`}
                labelLine={false}
              >
                {data.byCreative.map((_, i) => (
                  <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Por tipo de LP */}
        <ChartCard title="Por tipo de landing page">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data.byLp} margin={{ top: 5, right: 10, left: -18, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--border))" vertical={false} />
              <XAxis dataKey="name" tick={axisTick} tickLine={false} axisLine={false} interval={0} angle={-20} textAnchor="end" height={50} />
              <YAxis tick={axisTick} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgb(var(--surface-2))" }} />
              <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Por nicho (tag) */}
        <ChartCard title="Por nicho (top tags)">
          {data.byNiche.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted">Sem tags cadastradas.</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart layout="vertical" data={data.byNiche} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
                <XAxis type="number" tick={axisTick} tickLine={false} axisLine={false} allowDecimals={false} />
                <YAxis type="category" dataKey="name" tick={axisTick} tickLine={false} axisLine={false} width={90} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgb(var(--surface-2))" }} />
                <Bar dataKey="value" fill="#22c55e" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        {/* Padrões detectados */}
        <ChartCard title="Padrões detectados">
          <div className="space-y-4 text-sm">
            <div>
              <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted">
                Ganchos recorrentes
              </p>
              {patterns.topHooks.length === 0 ? (
                <p className="text-muted">Nenhum gancho se repete ainda.</p>
              ) : (
                <ul className="space-y-1">
                  {patterns.topHooks.map((h) => (
                    <li key={h.label} className="flex justify-between gap-2">
                      <span className="line-clamp-1">{h.label}</span>
                      <span className="shrink-0 rounded-full bg-surface-2 px-2 text-xs">
                        {h.count}×
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div>
              <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted">
                LP mais usada por nicho
              </p>
              <ul className="space-y-1">
                {patterns.lpByNiche.map((l, i) => (
                  <li key={i} className="flex justify-between gap-2">
                    <span>
                      <span className="text-brand">#{l.niche}</span> →{" "}
                      {LP_LABELS[l.lp as keyof typeof LP_LABELS] ?? l.lp}
                    </span>
                    <span className="shrink-0 text-xs text-muted">{l.count}×</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </ChartCard>
      </div>
    </div>
  );
}

function buildData(offers: Offer[]) {
  const byStatus: Record<string, number> = {};
  for (const o of offers) byStatus[o.status] = (byStatus[o.status] ?? 0) + 1;

  // por criativo
  const creativeCount: Record<string, number> = {};
  for (const o of offers)
    creativeCount[o.creativeType] = (creativeCount[o.creativeType] ?? 0) + 1;
  const byCreative = Object.entries(creativeCount).map(([k, v]) => ({
    name: CREATIVE_TYPE_LABELS[k as keyof typeof CREATIVE_TYPE_LABELS],
    value: v,
  }));

  // por LP
  const lpCount: Record<string, number> = {};
  for (const o of offers)
    lpCount[o.landingPageType] = (lpCount[o.landingPageType] ?? 0) + 1;
  const byLp = Object.entries(lpCount).map(([k, v]) => ({
    name: LP_LABELS[k as keyof typeof LP_LABELS],
    value: v,
  }));

  // por nicho (primeira tag)
  const nicheCount: Record<string, number> = {};
  for (const o of offers) {
    for (const t of o.tags) nicheCount[t] = (nicheCount[t] ?? 0) + 1;
  }
  const byNiche = Object.entries(nicheCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([k, v]) => ({ name: k, value: v }));

  // por semana (últimas 8)
  const weeks: { week: string; count: number }[] = [];
  const now = Date.now();
  for (let i = 7; i >= 0; i--) {
    const start = now - (i + 1) * 7 * 86400000;
    const end = now - i * 7 * 86400000;
    const count = offers.filter((o) => o.createdAt >= start && o.createdAt < end).length;
    const d = new Date(end);
    weeks.push({
      week: d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
      count,
    });
  }

  const funnel = OFFER_STATUSES.map((s) => ({ status: s, value: byStatus[s] ?? 0 }));

  const last30 = offers.filter((o) => o.createdAt >= now - 30 * 86400000).length;
  const avgScore = offers.length
    ? Math.round(offers.reduce((s, o) => s + o.score, 0) / offers.length)
    : 0;

  return { byStatus, byCreative, byLp, byNiche, perWeek: weeks, funnel, last30, avgScore };
}

const axisTick = { fontSize: 11, fill: "rgb(var(--muted))" };
const tooltipStyle = {
  background: "rgb(var(--surface))",
  border: "1px solid rgb(var(--border))",
  borderRadius: 8,
  fontSize: 12,
  color: "rgb(var(--fg))",
};

function Kpi({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: boolean;
}) {
  return (
    <div className="card p-4">
      <div className={`text-3xl font-bold ${accent ? "text-brand" : ""}`}>{value}</div>
      <div className="text-xs text-muted">{label}</div>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card p-4">
      <h3 className="mb-3 font-semibold">{title}</h3>
      {children}
    </div>
  );
}
