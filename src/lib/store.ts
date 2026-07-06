import { create } from "zustand";
import type {
  Offer,
  OfferDraft,
  OfferStatus,
  CreativeType,
  LandingPageType,
} from "./types";
import { repository } from "./repository";

// ---------------------------------------------------------------------------
// Store da aplicação. Guarda as ofertas em memória (espelho do IndexedDB) e os
// filtros da UI. Toda mutação vai ao repository e depois refaz o espelho.
// ---------------------------------------------------------------------------

export type ViewMode = "lista" | "grade" | "kanban";
export type SortKey = "recentes" | "score" | "nome" | "antigos";

interface Filters {
  search: string;
  creativeTypes: CreativeType[];
  lpTypes: LandingPageType[];
  statuses: OfferStatus[];
  tags: string[];
  sort: SortKey;
}

const emptyFilters: Filters = {
  search: "",
  creativeTypes: [],
  lpTypes: [],
  statuses: [],
  tags: [],
  sort: "recentes",
};

interface StoreState {
  offers: Offer[];
  loading: boolean;
  ready: boolean;
  view: ViewMode;
  filters: Filters;

  init: () => Promise<void>;
  refresh: () => Promise<void>;

  setView: (v: ViewMode) => void;
  setSearch: (s: string) => void;
  toggleCreativeType: (t: CreativeType) => void;
  toggleLpType: (t: LandingPageType) => void;
  toggleStatus: (s: OfferStatus) => void;
  toggleTag: (t: string) => void;
  setSort: (s: SortKey) => void;
  clearFilters: () => void;

  createOffer: (draft: OfferDraft) => Promise<Offer>;
  updateOffer: (id: string, patch: Partial<Offer>, msg?: string) => Promise<void>;
  setStatus: (id: string, status: OfferStatus) => Promise<void>;
  duplicateOffer: (id: string) => Promise<void>;
  deleteOffer: (id: string) => Promise<void>;
  addAdCheck: (id: string, activeAds: number, source: "manual" | "auto") => Promise<void>;
}

export const useStore = create<StoreState>((set, get) => ({
  offers: [],
  loading: true,
  ready: false,
  view: "grade",
  filters: emptyFilters,

  async init() {
    if (get().ready) return;
    await repository.init();
    const offers = await repository.listOffers();
    set({ offers, loading: false, ready: true });
  },

  async refresh() {
    const offers = await repository.listOffers();
    set({ offers });
  },

  setView: (view) => set({ view }),
  setSearch: (search) =>
    set((s) => ({ filters: { ...s.filters, search } })),
  setSort: (sort) => set((s) => ({ filters: { ...s.filters, sort } })),
  clearFilters: () => set({ filters: emptyFilters }),

  toggleCreativeType: (t) =>
    set((s) => ({
      filters: {
        ...s.filters,
        creativeTypes: toggle(s.filters.creativeTypes, t),
      },
    })),
  toggleLpType: (t) =>
    set((s) => ({
      filters: { ...s.filters, lpTypes: toggle(s.filters.lpTypes, t) },
    })),
  toggleStatus: (t) =>
    set((s) => ({
      filters: { ...s.filters, statuses: toggle(s.filters.statuses, t) },
    })),
  toggleTag: (t) =>
    set((s) => ({
      filters: { ...s.filters, tags: toggle(s.filters.tags, t) },
    })),

  async createOffer(draft) {
    const offer = await repository.createOffer(draft);
    await get().refresh();
    return offer;
  },
  async updateOffer(id, patch, msg) {
    await repository.updateOffer(id, patch, msg);
    await get().refresh();
  },
  async setStatus(id, status) {
    await repository.setStatus(id, status);
    await get().refresh();
  },
  async duplicateOffer(id) {
    await repository.duplicateOffer(id);
    await get().refresh();
  },
  async deleteOffer(id) {
    await repository.deleteOffer(id);
    await get().refresh();
  },
  async addAdCheck(id, activeAds, source) {
    await repository.addAdCheck(id, { activeAds, source });
    await get().refresh();
  },
}));

function toggle<T>(arr: T[], item: T): T[] {
  return arr.includes(item) ? arr.filter((x) => x !== item) : [...arr, item];
}

// --- Seletores derivados ---------------------------------------------------

export function selectAllTags(offers: Offer[]): string[] {
  const set = new Set<string>();
  for (const o of offers) for (const t of o.tags) set.add(t);
  return [...set].sort((a, b) => a.localeCompare(b));
}

export function selectFilteredOffers(
  offers: Offer[],
  filters: Filters,
): Offer[] {
  const q = filters.search.trim().toLowerCase();
  let out = offers.filter((o) => {
    if (filters.creativeTypes.length && !filters.creativeTypes.includes(o.creativeType))
      return false;
    if (filters.lpTypes.length && !filters.lpTypes.includes(o.landingPageType))
      return false;
    if (filters.statuses.length && !filters.statuses.includes(o.status))
      return false;
    // Filtro por tags: precisa conter TODAS as tags selecionadas (AND).
    if (filters.tags.length && !filters.tags.every((t) => o.tags.includes(t)))
      return false;
    if (q) {
      const haystack = [
        o.name,
        o.product,
        o.copy,
        o.hook,
        o.notes,
        o.audience,
        o.cta,
        o.tags.join(" "),
      ]
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });

  out = [...out].sort((a, b) => {
    // Fixados sempre no topo.
    if (a.priorityPinned !== b.priorityPinned) return a.priorityPinned ? -1 : 1;
    switch (filters.sort) {
      case "score":
        return b.score - a.score;
      case "nome":
        return a.name.localeCompare(b.name);
      case "antigos":
        return a.createdAt - b.createdAt;
      case "recentes":
      default:
        return b.createdAt - a.createdAt;
    }
  });
  return out;
}
