"use client";

import { useEffect, useState } from "react";
import { repository } from "@/lib/repository";
import { useStore } from "@/lib/store";
import type { AutomationSettings } from "@/lib/types";
import { Modal } from "./Modal";
import { IconClock, IconSparkles } from "./icons";
import { fmtRelative } from "./ui";

// ---------------------------------------------------------------------------
// Painel de automação de monitoramento. TUDO MOCKADO no v1:
// - "Verificar agora" gera uma contagem simulada de anúncios ativos.
// - O agendamento 7h/12h é só visual (o cron real roda num backend na fase 2).
// A UI e o histórico já ficam prontos para plugar o coletor do Facebook depois.
// ---------------------------------------------------------------------------

export function AutomationPanel({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const offers = useStore((s) => s.offers);
  const addAdCheck = useStore((s) => s.addAdCheck);
  const [settings, setSettings] = useState<AutomationSettings | null>(null);
  const [running, setRunning] = useState(false);
  const [log, setLog] = useState<string[]>([]);

  useEffect(() => {
    if (open) repository.getAutomation().then(setSettings);
  }, [open]);

  // Ofertas monitoradas = as que estão escalando ou validadas (as "escaladas").
  const monitored = offers.filter(
    (o) => o.status === "escalando" || o.status === "validada",
  );

  async function save(patch: Partial<AutomationSettings>) {
    await repository.setAutomation(patch);
    setSettings((s) => (s ? { ...s, ...patch } : s));
  }

  // Simula a verificação: para cada oferta monitorada, gera uma contagem.
  async function runCheck() {
    setRunning(true);
    setLog([]);
    const lines: string[] = [];
    for (const o of monitored) {
      const last = o.adChecks[o.adChecks.length - 1]?.activeAds ?? 5;
      // variação simulada de -2 a +4 anúncios
      const next = Math.max(0, last + Math.floor(Math.random() * 7) - 2);
      await addAdCheck(o.id, next, "auto");
      const trend = next > last ? "↑" : next < last ? "↓" : "→";
      lines.push(`${o.name}: ${next} anúncios ativos ${trend}`);
      setLog([...lines]);
      await new Promise((r) => setTimeout(r, 250));
    }
    await save({ lastRunAt: Date.now() });
    if (monitored.length === 0) lines.push("Nenhuma oferta escalando/validada para monitorar.");
    setLog([...lines]);
    setRunning(false);
  }

  return (
    <Modal open={open} onClose={onClose} title="Automação de monitoramento" wide>
      <div className="space-y-5">
        <div className="rounded-lg border border-brand/30 bg-brand/5 p-3 text-sm">
          <div className="flex items-center gap-2 font-medium text-brand">
            <IconSparkles width={16} height={16} /> Versão v1 (simulada)
          </div>
          <p className="mt-1 text-muted">
            No v1 a contagem de anúncios é <strong>simulada</strong>. A estrutura
            (verificação manual, histórico e agenda 7h/12h) já está pronta para
            plugar o coletor real da Biblioteca de Anúncios do Facebook + um
            servidor com cron na fase 2.
          </p>
        </div>

        {settings && (
          <div className="flex flex-col gap-4 rounded-lg border border-border p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2 font-medium">
                <IconClock width={18} height={18} />
                Verificação automática
              </div>
              <p className="mt-0.5 text-sm text-muted">
                Horários: {settings.times.join(" e ")} ·{" "}
                {settings.lastRunAt
                  ? `última: ${fmtRelative(settings.lastRunAt)}`
                  : "nunca executada"}
              </p>
            </div>
            <label className="flex items-center gap-2">
              <span className="text-sm">{settings.enabled ? "Ativada" : "Desativada"}</span>
              <button
                onClick={() => save({ enabled: !settings.enabled })}
                className={`relative h-6 w-11 rounded-full transition-colors ${
                  settings.enabled ? "bg-brand" : "bg-surface-2"
                }`}
              >
                <span
                  className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                    settings.enabled ? "translate-x-5" : "translate-x-0.5"
                  }`}
                />
              </button>
            </label>
          </div>
        )}

        <div>
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">
              Ofertas monitoradas ({monitored.length})
            </p>
            <button className="btn-primary" onClick={runCheck} disabled={running}>
              {running ? "Verificando…" : "Verificar agora"}
            </button>
          </div>
          <p className="mt-1 text-xs text-muted">
            Monitora ofertas com status “Escalando” ou “Validada”.
          </p>

          {log.length > 0 && (
            <div className="mt-3 space-y-1 rounded-lg bg-surface-2 p-3 font-mono text-xs">
              {log.map((l, i) => (
                <div key={i} className="fade-in">
                  › {l}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
