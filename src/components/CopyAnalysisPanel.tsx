"use client";

import { useState } from "react";
import { analyzeCopy, type CopyAnalysis } from "@/lib/aiService";
import { IconSparkles } from "./icons";

// Painel de análise de copy (mock/heurística no v1).
export function CopyAnalysisPanel({
  copy,
  onApplyHook,
  onApplyAudience,
}: {
  copy: string;
  onApplyHook: (hook: string) => void;
  onApplyAudience: (audience: string) => void;
}) {
  const [result, setResult] = useState<CopyAnalysis | null>(null);
  const [loading, setLoading] = useState(false);

  async function run() {
    if (!copy.trim()) return;
    setLoading(true);
    const r = await analyzeCopy(copy);
    setResult(r);
    setLoading(false);
  }

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 font-semibold">
          <IconSparkles width={18} height={18} className="text-brand" />
          Assistente de copy
        </h3>
        <button
          className="btn-primary"
          onClick={run}
          disabled={loading || !copy.trim()}
        >
          {loading ? "Analisando…" : result ? "Analisar de novo" : "Analisar copy"}
        </button>
      </div>

      {!copy.trim() && (
        <p className="mt-2 text-sm text-muted">
          Adicione a copy da oferta para receber sugestões.
        </p>
      )}

      {result && (
        <div className="mt-4 space-y-4 fade-in">
          {result.mock && (
            <p className="rounded-md bg-surface-2 px-2 py-1 text-xs text-muted">
              Sugestões geradas por heurística local (mock). Na fase 2 vêm da IA
              real via API Claude.
            </p>
          )}

          <Field label="Gancho / ângulo detectado">
            <div className="flex items-start justify-between gap-2">
              <span>{result.hook}</span>
              <button
                className="btn-outline shrink-0 !py-1 !text-xs"
                onClick={() => onApplyHook(result.hook)}
              >
                Usar
              </button>
            </div>
          </Field>

          <Field label="Público-alvo provável">
            <div className="flex items-start justify-between gap-2">
              <span>{result.audience}</span>
              <button
                className="btn-outline shrink-0 !py-1 !text-xs"
                onClick={() => onApplyAudience(result.audience)}
              >
                Usar
              </button>
            </div>
          </Field>

          <Field label="Pontos fortes da copy">
            <ul className="space-y-0.5">
              {result.strengths.map((s, i) => (
                <li key={i} className="flex gap-1.5">
                  <span className="text-green-500">✓</span> {s}
                </li>
              ))}
            </ul>
          </Field>

          <Field label="Ideias de variação (hooks para testar)">
            <ul className="space-y-1.5">
              {result.variations.map((v, i) => (
                <li key={i} className="rounded-md bg-surface-2 px-2.5 py-1.5">
                  {v}
                </li>
              ))}
            </ul>
          </Field>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted">
        {label}
      </p>
      <div className="text-sm">{children}</div>
    </div>
  );
}
