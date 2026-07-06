"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useStore } from "@/lib/store";
import { IconClock, IconX } from "./icons";

const STALE_DAYS = 7;

// Lembrete de ofertas "Para Testar" paradas há mais de X dias.
export function RemindersBanner() {
  const offers = useStore((s) => s.offers);
  const [dismissed, setDismissed] = useState(false);

  const stale = useMemo(() => {
    const cutoff = Date.now() - STALE_DAYS * 86_400_000;
    return offers
      .filter((o) => o.status === "para-testar" && o.createdAt < cutoff)
      .sort((a, b) => a.createdAt - b.createdAt);
  }, [offers]);

  if (dismissed || stale.length === 0) return null;

  return (
    <div className="flex items-start gap-3 rounded-xl border border-amber-400/40 bg-amber-400/10 p-3 text-sm fade-in">
      <IconClock width={18} height={18} className="mt-0.5 shrink-0 text-amber-500" />
      <div className="flex-1">
        <p className="font-medium text-amber-600 dark:text-amber-400">
          {stale.length} oferta(s) “Para Testar” parada(s) há mais de {STALE_DAYS} dias
        </p>
        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-muted">
          {stale.slice(0, 4).map((o) => (
            <Link key={o.id} href={`/oferta/${o.id}`} className="hover:text-fg hover:underline">
              {o.name}
            </Link>
          ))}
          {stale.length > 4 && <span>+{stale.length - 4} mais</span>}
        </div>
      </div>
      <button
        className="rounded-md p-1 text-muted hover:bg-amber-400/20"
        onClick={() => setDismissed(true)}
        aria-label="Dispensar"
      >
        <IconX width={16} height={16} />
      </button>
    </div>
  );
}
