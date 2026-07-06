// ---------------------------------------------------------------------------
// Domínio do Swipe Vault. Um único lugar para os tipos de dados das ofertas.
// A camada de dados (repository) e a UI dependem só daqui.
// ---------------------------------------------------------------------------

export type CreativeType = "video" | "imagem" | "carrossel" | "colecao";

export type Platform =
  | "facebook"
  | "instagram"
  | "tiktok"
  | "youtube"
  | "google"
  | "outro";

export type Objective =
  | "conversao"
  | "trafego"
  | "engajamento"
  | "vendas"
  | "leads";

export type LandingPageType =
  | "vsl"
  | "advertorial"
  | "quiz"
  | "pagina-de-vendas"
  | "webinar"
  | "lp-simples";

// Colunas do kanban / ciclo de vida da oferta.
export type OfferStatus =
  | "para-testar"
  | "testando"
  | "validada"
  | "escalando"
  | "descartada";

export const OFFER_STATUSES: OfferStatus[] = [
  "para-testar",
  "testando",
  "validada",
  "escalando",
  "descartada",
];

export interface Attachment {
  id: string;
  /** data URL (base64) do print/variação — persistido no IndexedDB */
  dataUrl: string;
  name: string;
  addedAt: number;
}

export interface HistoryEntry {
  id: string;
  at: number;
  /** descrição legível da mudança, ex: "Status: para-testar → testando" */
  message: string;
}

/**
 * Registro de uma verificação automática (contagem de anúncios ativos).
 * No v1 é alimentado manualmente/mockado; na fase 2 vem do coletor do Facebook.
 */
export interface AdCheck {
  id: string;
  at: number;
  activeAds: number;
  source: "manual" | "auto";
  note?: string;
}

export interface Offer {
  id: string;

  // --- Campos essenciais (cadastro rápido) ---
  name: string;
  product: string;
  link: string; // Ad Library / anúncio / landing page
  thumbnailUrl: string;
  creativeType: CreativeType;
  status: OfferStatus;

  // --- Classificação ---
  platform: Platform;
  objective: Objective;
  landingPageType: LandingPageType;
  tags: string[]; // livres: nicho, país, idioma etc.

  // --- Conteúdo criativo ---
  hook: string; // gancho/ângulo
  copy: string;
  cta: string;
  audience: string; // público-alvo

  // --- Performance / priorização ---
  notes: string;
  score: number; // 0-100, calculado por scoring.ts
  priorityPinned: boolean;

  // --- Metadados ---
  originalDate?: string; // data de criação original do anúncio (ISO date)
  createdAt: number;
  updatedAt: number;

  // --- Coleções aninhadas ---
  attachments: Attachment[];
  history: HistoryEntry[];
  adChecks: AdCheck[];
}

/** Configurações de automação (mockadas no v1). */
export interface AutomationSettings {
  id: "singleton";
  enabled: boolean;
  times: string[]; // ex: ["07:00", "12:00"]
  lastRunAt?: number;
}

// Payload para criar/editar (sem os campos derivados/gerados).
export type OfferDraft = Omit<
  Offer,
  "id" | "createdAt" | "updatedAt" | "history" | "adChecks" | "score"
> & {
  attachments?: Attachment[];
};

export const CREATIVE_TYPE_LABELS: Record<CreativeType, string> = {
  video: "Vídeo",
  imagem: "Imagem",
  carrossel: "Carrossel",
  colecao: "Coleção",
};

export const STATUS_LABELS: Record<OfferStatus, string> = {
  "para-testar": "Para Testar",
  testando: "Testando",
  validada: "Validada",
  escalando: "Escalando",
  descartada: "Descartada",
};

export const STATUS_COLORS: Record<OfferStatus, string> = {
  "para-testar": "#64748b", // slate
  testando: "#f59e0b", // amber
  validada: "#3b82f6", // blue
  escalando: "#22c55e", // green
  descartada: "#ef4444", // red
};

export const OBJECTIVE_LABELS: Record<Objective, string> = {
  conversao: "Conversão",
  trafego: "Tráfego",
  engajamento: "Engajamento",
  vendas: "Vendas",
  leads: "Leads",
};

export const LP_LABELS: Record<LandingPageType, string> = {
  vsl: "VSL",
  advertorial: "Advertorial",
  quiz: "Quiz",
  "pagina-de-vendas": "Página de Vendas",
  webinar: "Webinar",
  "lp-simples": "LP Simples",
};

export const PLATFORM_LABELS: Record<Platform, string> = {
  facebook: "Facebook",
  instagram: "Instagram",
  tiktok: "TikTok",
  youtube: "YouTube",
  google: "Google",
  outro: "Outro",
};
