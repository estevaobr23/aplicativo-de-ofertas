"use client";

// Checklist fixo do workflow swipe → adaptar → testar → validar.
// Guardado no campo notes? Não — mantemos simples: guardamos no localStorage
// por oferta no v1 (na fase 2 vira coluna no banco / colaboração).

import { useEffect, useState } from "react";

const STEPS = [
  { key: "swipe", label: "Swipe (salvar a oferta)" },
  { key: "adaptar", label: "Adaptar criativo/copy" },
  { key: "testar", label: "Subir teste" },
  { key: "validar", label: "Validar resultado" },
] as const;

export function WorkflowChecklist({ offerId }: { offerId: string }) {
  const storageKey = `sv-checklist-${offerId}`;
  const [done, setDone] = useState<Record<string, boolean>>({});

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) setDone(JSON.parse(raw));
    } catch {
      /* ignore */
    }
  }, [storageKey]);

  function toggle(key: string) {
    const next = { ...done, [key]: !done[key] };
    setDone(next);
    localStorage.setItem(storageKey, JSON.stringify(next));
  }

  const completed = STEPS.filter((s) => done[s.key]).length;

  return (
    <div className="card p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-semibold">Checklist</h3>
        <span className="text-xs text-muted">
          {completed}/{STEPS.length}
        </span>
      </div>
      <div className="space-y-2">
        {STEPS.map((s) => (
          <label
            key={s.key}
            className="flex cursor-pointer items-center gap-2.5 text-sm"
          >
            <input
              type="checkbox"
              checked={!!done[s.key]}
              onChange={() => toggle(s.key)}
              className="h-4 w-4 accent-[rgb(var(--brand))]"
            />
            <span className={done[s.key] ? "text-muted line-through" : ""}>
              {s.label}
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}
