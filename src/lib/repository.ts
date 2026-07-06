import { nanoid } from "nanoid";
import { getDB } from "./db";
import type {
  Offer,
  OfferDraft,
  OfferStatus,
  AutomationSettings,
  AdCheck,
  HistoryEntry,
} from "./types";
import { STATUS_LABELS } from "./types";
import { computeScore } from "./scoring";
import { buildSeedOffers } from "./seed";

// ---------------------------------------------------------------------------
// Repositório: a fronteira entre a UI e o armazenamento. TODA leitura/escrita
// passa por aqui. Trocar IndexedDB por Supabase na fase 2 = reescrever só este
// arquivo, mantendo as assinaturas.
// ---------------------------------------------------------------------------

const now = () => Date.now();

export const repository = {
  async init(): Promise<void> {
    const db = getDB();
    const count = await db.offers.count();
    if (count === 0) {
      await db.offers.bulkAdd(buildSeedOffers());
    }
    const auto = await db.automation.get("singleton");
    if (!auto) {
      await db.automation.put({
        id: "singleton",
        enabled: false,
        times: ["07:00", "12:00"],
      });
    }
  },

  async listOffers(): Promise<Offer[]> {
    return getDB().offers.toArray();
  },

  async getOffer(id: string): Promise<Offer | undefined> {
    return getDB().offers.get(id);
  },

  async createOffer(draft: OfferDraft): Promise<Offer> {
    const ts = now();
    const base: Offer = {
      ...draft,
      id: nanoid(),
      attachments: draft.attachments ?? [],
      createdAt: ts,
      updatedAt: ts,
      score: 0,
      adChecks: [],
      history: [{ id: nanoid(), at: ts, message: "Oferta criada" }],
    };
    base.score = computeScore(base);
    await getDB().offers.add(base);
    return base;
  },

  async updateOffer(
    id: string,
    patch: Partial<Offer>,
    changeMessage?: string,
  ): Promise<Offer> {
    const db = getDB();
    const existing = await db.offers.get(id);
    if (!existing) throw new Error(`Oferta ${id} não encontrada`);

    const merged: Offer = { ...existing, ...patch, id, updatedAt: now() };
    merged.score = computeScore(merged);

    const history = [...existing.history];
    const msg = changeMessage ?? diffMessage(existing, merged);
    if (msg) {
      history.unshift({ id: nanoid(), at: now(), message: msg });
    }
    merged.history = history.slice(0, 50);

    await db.offers.put(merged);
    return merged;
  },

  async setStatus(id: string, status: OfferStatus): Promise<Offer> {
    const existing = await getDB().offers.get(id);
    if (!existing) throw new Error("Oferta não encontrada");
    if (existing.status === status) return existing;
    return repository.updateOffer(
      id,
      { status },
      `Status: ${STATUS_LABELS[existing.status]} → ${STATUS_LABELS[status]}`,
    );
  },

  async duplicateOffer(id: string): Promise<Offer> {
    const src = await getDB().offers.get(id);
    if (!src) throw new Error("Oferta não encontrada");
    const ts = now();
    const copy: Offer = {
      ...src,
      id: nanoid(),
      name: `${src.name} (cópia)`,
      status: "para-testar",
      createdAt: ts,
      updatedAt: ts,
      adChecks: [],
      priorityPinned: false,
      history: [{ id: nanoid(), at: ts, message: `Duplicada de "${src.name}"` }],
    };
    await getDB().offers.add(copy);
    return copy;
  },

  async deleteOffer(id: string): Promise<void> {
    await getDB().offers.delete(id);
  },

  async addAdCheck(
    id: string,
    check: Omit<AdCheck, "id" | "at">,
  ): Promise<Offer> {
    const existing = await getDB().offers.get(id);
    if (!existing) throw new Error("Oferta não encontrada");
    const entry: AdCheck = { ...check, id: nanoid(), at: now() };
    const adChecks = [...existing.adChecks, entry];
    return repository.updateOffer(
      id,
      { adChecks },
      `Verificação (${check.source}): ${check.activeAds} anúncios ativos`,
    );
  },

  async addHistory(id: string, message: string): Promise<void> {
    const existing = await getDB().offers.get(id);
    if (!existing) return;
    const entry: HistoryEntry = { id: nanoid(), at: now(), message };
    await getDB().offers.update(id, {
      history: [entry, ...existing.history].slice(0, 50),
    });
  },

  async bulkCreate(drafts: OfferDraft[]): Promise<number> {
    const ts = now();
    const offers: Offer[] = drafts.map((draft) => {
      const o: Offer = {
        ...draft,
        id: nanoid(),
        attachments: draft.attachments ?? [],
        createdAt: ts,
        updatedAt: ts,
        score: 0,
        adChecks: [],
        history: [{ id: nanoid(), at: ts, message: "Importada via CSV" }],
      };
      o.score = computeScore(o);
      return o;
    });
    await getDB().offers.bulkAdd(offers);
    return offers.length;
  },

  // --- Automação ---
  async getAutomation(): Promise<AutomationSettings> {
    const a = await getDB().automation.get("singleton");
    return (
      a ?? { id: "singleton", enabled: false, times: ["07:00", "12:00"] }
    );
  },

  async setAutomation(patch: Partial<AutomationSettings>): Promise<void> {
    const current = await repository.getAutomation();
    await getDB().automation.put({ ...current, ...patch, id: "singleton" });
  },
};

// Gera uma mensagem de histórico legível comparando antes/depois.
function diffMessage(before: Offer, after: Offer): string {
  const changed: string[] = [];
  const fields: (keyof Offer)[] = [
    "name",
    "product",
    "link",
    "hook",
    "copy",
    "cta",
    "audience",
    "notes",
    "creativeType",
    "landingPageType",
    "platform",
    "objective",
  ];
  for (const f of fields) {
    if (before[f] !== after[f]) changed.push(String(f));
  }
  if (JSON.stringify(before.tags) !== JSON.stringify(after.tags)) {
    changed.push("tags");
  }
  if (changed.length === 0) return "";
  return `Editado: ${changed.join(", ")}`;
}
