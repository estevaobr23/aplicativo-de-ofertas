import Dexie, { type Table } from "dexie";
import type { Offer, AutomationSettings } from "./types";

// ---------------------------------------------------------------------------
// IndexedDB via Dexie. Esta é a ÚNICA dependência concreta de armazenamento.
// Na fase 2, o repository (repository.ts) troca esta implementação por chamadas
// ao Supabase; a UI não sabe onde os dados moram.
// ---------------------------------------------------------------------------

export class SwipeVaultDB extends Dexie {
  offers!: Table<Offer, string>;
  automation!: Table<AutomationSettings, string>;

  constructor() {
    super("swipe-vault");
    this.version(1).stores({
      // Índices para busca/filtro rápidos. Campos não indexados também são
      // persistidos — só não dá pra fazer where() neles.
      offers:
        "id, name, product, status, creativeType, landingPageType, platform, objective, createdAt, updatedAt, score",
      automation: "id",
    });
  }
}

// Singleton — só existe no browser.
let _db: SwipeVaultDB | null = null;

export function getDB(): SwipeVaultDB {
  if (typeof window === "undefined") {
    throw new Error("getDB() só pode ser chamado no cliente");
  }
  if (!_db) _db = new SwipeVaultDB();
  return _db;
}
