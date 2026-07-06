"use client";

import { useState } from "react";
import { useStore, selectAllTags, type SortKey } from "@/lib/store";
import {
  CREATIVE_TYPE_LABELS,
  LP_LABELS,
  STATUS_LABELS,
  OFFER_STATUSES,
  type CreativeType,
  type LandingPageType,
} from "@/lib/types";

export function FilterBar() {
  const filters = useStore((s) => s.filters);
  const offers = useStore((s) => s.offers);
  const toggleCreativeType = useStore((s) => s.toggleCreativeType);
  const toggleLpType = useStore((s) => s.toggleLpType);
  const toggleStatus = useStore((s) => s.toggleStatus);
  const toggleTag = useStore((s) => s.toggleTag);
  const setSort = useStore((s) => s.setSort);
  const clearFilters = useStore((s) => s.clearFilters);

  const [expanded, setExpanded] = useState(false);
  const allTags = selectAllTags(offers);

  const activeCount =
    filters.creativeTypes.length +
    filters.lpTypes.length +
    filters.statuses.length +
    filters.tags.length;

  return (
    <div className="card p-3">
      <div className="flex flex-wrap items-center gap-2">
        <button
          className="btn-outline"
          onClick={() => setExpanded((v) => !v)}
        >
          Filtros
          {activeCount > 0 && (
            <span className="ml-1 rounded-full bg-brand px-1.5 text-xs text-brand-fg">
              {activeCount}
            </span>
          )}
        </button>

        {/* Chips de status (acesso rápido) */}
        <div className="flex flex-wrap gap-1.5">
          {OFFER_STATUSES.map((s) => (
            <button
              key={s}
              className={`chip ${filters.statuses.includes(s) ? "chip-active" : ""}`}
              onClick={() => toggleStatus(s)}
            >
              {STATUS_LABELS[s]}
            </button>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-2">
          {activeCount > 0 && (
            <button className="text-xs text-muted hover:text-fg" onClick={clearFilters}>
              Limpar
            </button>
          )}
          <select
            className="input !w-auto"
            value={filters.sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
          >
            <option value="recentes">Mais recentes</option>
            <option value="antigos">Mais antigos</option>
            <option value="score">Maior score</option>
            <option value="nome">Nome (A-Z)</option>
          </select>
        </div>
      </div>

      {expanded && (
        <div className="mt-3 space-y-3 border-t border-border pt-3 fade-in">
          <FilterGroup label="Tipo de criativo">
            {(Object.keys(CREATIVE_TYPE_LABELS) as CreativeType[]).map((t) => (
              <button
                key={t}
                className={`chip ${filters.creativeTypes.includes(t) ? "chip-active" : ""}`}
                onClick={() => toggleCreativeType(t)}
              >
                {CREATIVE_TYPE_LABELS[t]}
              </button>
            ))}
          </FilterGroup>

          <FilterGroup label="Tipo de LP">
            {(Object.keys(LP_LABELS) as LandingPageType[]).map((t) => (
              <button
                key={t}
                className={`chip ${filters.lpTypes.includes(t) ? "chip-active" : ""}`}
                onClick={() => toggleLpType(t)}
              >
                {LP_LABELS[t]}
              </button>
            ))}
          </FilterGroup>

          {allTags.length > 0 && (
            <FilterGroup label="Tags (combina com E — precisa ter todas)">
              {allTags.map((t) => (
                <button
                  key={t}
                  className={`chip ${filters.tags.includes(t) ? "chip-active" : ""}`}
                  onClick={() => toggleTag(t)}
                >
                  #{t}
                </button>
              ))}
            </FilterGroup>
          )}
        </div>
      )}
    </div>
  );
}

function FilterGroup({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="mb-1.5 text-xs font-medium text-muted">{label}</p>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  );
}
