"use client";

import { useState } from "react";
import Link from "next/link";
import type { Offer, OfferStatus } from "@/lib/types";
import { OFFER_STATUSES, STATUS_LABELS, STATUS_COLORS } from "@/lib/types";
import { Thumb, ScoreRing } from "../ui";
import { IconStar } from "../icons";

export function KanbanView({
  offers,
  onStatusChange,
}: {
  offers: Offer[];
  onStatusChange: (id: string, status: OfferStatus) => void;
}) {
  const [dragId, setDragId] = useState<string | null>(null);
  const [overCol, setOverCol] = useState<OfferStatus | null>(null);

  const byStatus = (s: OfferStatus) => offers.filter((o) => o.status === s);

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {OFFER_STATUSES.map((status) => {
        const items = byStatus(status);
        const color = STATUS_COLORS[status];
        const isOver = overCol === status;
        return (
          <div
            key={status}
            className={`flex w-72 shrink-0 flex-col rounded-xl border transition-colors ${
              isOver ? "border-brand bg-brand/5" : "border-border bg-surface-2/40"
            }`}
            onDragOver={(e) => {
              e.preventDefault();
              setOverCol(status);
            }}
            onDragLeave={() => setOverCol((c) => (c === status ? null : c))}
            onDrop={() => {
              if (dragId) onStatusChange(dragId, status);
              setDragId(null);
              setOverCol(null);
            }}
          >
            <div className="flex items-center justify-between px-3 py-2.5">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
                <span className="text-sm font-semibold">{STATUS_LABELS[status]}</span>
              </div>
              <span className="rounded-full bg-surface px-2 py-0.5 text-xs text-muted">
                {items.length}
              </span>
            </div>

            <div className="flex-1 space-y-2 overflow-y-auto px-2 pb-2" style={{ minHeight: 120, maxHeight: "calc(100vh - 260px)" }}>
              {items.map((o) => (
                <div
                  key={o.id}
                  draggable
                  onDragStart={() => setDragId(o.id)}
                  onDragEnd={() => {
                    setDragId(null);
                    setOverCol(null);
                  }}
                  className={`card cursor-grab p-2.5 active:cursor-grabbing ${
                    dragId === o.id ? "opacity-40" : ""
                  }`}
                >
                  <div className="flex gap-2.5">
                    <Thumb
                      src={o.thumbnailUrl}
                      alt={o.name}
                      className="h-12 w-16 shrink-0 rounded-md"
                    />
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/oferta/${o.id}`}
                        className="flex items-center gap-1 text-sm font-medium hover:text-brand"
                      >
                        {o.priorityPinned && (
                          <IconStar width={12} height={12} className="shrink-0 text-brand" fill="currentColor" />
                        )}
                        <span className="line-clamp-2">{o.name}</span>
                      </Link>
                    </div>
                    <ScoreRing score={o.score} size={30} />
                  </div>
                  {o.tags.length > 0 && (
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {o.tags.slice(0, 3).map((t) => (
                        <span key={t} className="text-[10px] text-brand">
                          #{t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              {items.length === 0 && (
                <div className="flex h-24 items-center justify-center rounded-lg border border-dashed border-border text-xs text-muted">
                  arraste aqui
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
