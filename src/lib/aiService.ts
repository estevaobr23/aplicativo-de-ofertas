import type { Offer } from "./types";

// ---------------------------------------------------------------------------
// Serviço de "inteligência". No v1 tudo é HEURÍSTICA LOCAL (mockado).
// Na fase 2, cada função abaixo vira uma chamada a /api/ai/* que fala com a
// API da Claude num backend (a chave NUNCA fica no frontend). A assinatura das
// funções foi desenhada para não mudar quando isso acontecer.
// ---------------------------------------------------------------------------

export interface CopyAnalysis {
  hook: string;
  audience: string;
  strengths: string[];
  variations: string[]; // hooks alternativos para testar
  mock: boolean; // true enquanto não há IA real
}

export interface LinkMetadata {
  advertiser?: string;
  adText?: string;
  thumbnailUrl?: string;
  guessedPlatform?: Offer["platform"];
  mock: boolean;
}

// pequeno delay para simular chamada de rede (e testar estados de loading)
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

// --- Análise de copy -------------------------------------------------------

const HOOK_PATTERNS: { re: RegExp; label: string }[] = [
  { re: /descobr|segredo|revel|ningu[eé]m te cont/i, label: "Curiosidade / segredo" },
  { re: /voc[eê] (?:est[aá]|vem) (?:errado|fazendo)/i, label: "Contraintuitivo / erro comum" },
  { re: /em \d+ dias|r[aá]pido|imediat|agora mesmo/i, label: "Resultado rápido" },
  { re: /sem (?:precisar|sair|gastar|dieta|academia)/i, label: "Sem esforço / objeção quebrada" },
  { re: /\d+ (?:passos|formas|maneiras|motivos)/i, label: "Lista / how-to" },
  { re: /antes que|[uú]ltim[ao]|acaba|vaga|limitad/i, label: "Escassez / urgência" },
  { re: /garant|comprovad|cientif|estud/i, label: "Prova / autoridade" },
];

function detectHook(copy: string): string {
  for (const p of HOOK_PATTERNS) if (p.re.test(copy)) return p.label;
  const firstLine = copy.split(/\n|\.|!/)[0]?.trim();
  return firstLine ? `Afirmação direta: "${truncate(firstLine, 60)}"` : "Não identificado";
}

const AUDIENCE_SIGNALS: { re: RegExp; who: string }[] = [
  { re: /emagrec|gordura|barriga|dieta|magr/i, who: "Pessoas buscando emagrecer" },
  { re: /renda|dinheiro|ganhar|financ|invest|d[ií]vida/i, who: "Interessados em renda extra/finanças" },
  { re: /pele|rugas|cabelo|beleza|est[eé]tic/i, who: "Público de beleza/estética" },
  { re: /ansiedade|sono|estresse|energia|saud/i, who: "Público de saúde e bem-estar" },
  { re: /pet|cachorro|gato/i, who: "Donos de pets" },
  { re: /relacionamento|ex|conquist|amor/i, who: "Público de relacionamentos" },
  { re: /filho|beb[eê]|m[aã]e|gravid/i, who: "Mães / famílias" },
];

function detectAudience(copy: string): string {
  const hits = AUDIENCE_SIGNALS.filter((s) => s.re.test(copy)).map((s) => s.who);
  return hits.length ? hits.join(" · ") : "Público amplo (sinais fracos na copy)";
}

function detectStrengths(copy: string): string[] {
  const out: string[] = [];
  if (/\d/.test(copy)) out.push("Usa números concretos (dá credibilidade)");
  if (/[?]/.test(copy)) out.push("Faz perguntas (engaja o leitor)");
  if (/voc[eê]/i.test(copy)) out.push("Fala direto com o leitor ('você')");
  if (/garant|comprovad|estud|cientif/i.test(copy)) out.push("Traz elementos de prova/autoridade");
  if (/agora|hoje|clique|acesse|garanta/i.test(copy)) out.push("Tem CTA/urgência clara");
  if (copy.trim().length > 300) out.push("Copy longa — bom material para adaptar");
  if (out.length === 0) out.push("Copy curta e direta");
  return out;
}

function buildVariations(hook: string, copy: string): string[] {
  const tema = detectAudience(copy).split(" · ")[0].toLowerCase();
  return [
    `Versão pergunta: "E se o problema de ${tema} não fosse culpa sua?"`,
    `Versão erro comum: "O erro nº 1 que sabota quem tenta ${simplify(tema)}"`,
    `Versão prova social: "Como milhares resolveram isso em poucos dias"`,
    `Versão contraste (mantendo o gancho '${truncate(hook, 30)}'): abra com a dor antes da solução`,
  ];
}

export async function analyzeCopy(copy: string): Promise<CopyAnalysis> {
  await wait(500);
  const clean = copy.trim();
  const hook = detectHook(clean);
  return {
    hook,
    audience: detectAudience(clean),
    strengths: detectStrengths(clean),
    variations: buildVariations(hook, clean),
    mock: true,
  };
}

// --- Extração de metadados do link ----------------------------------------

export async function extractLinkMetadata(link: string): Promise<LinkMetadata> {
  await wait(400);
  let guessedPlatform: Offer["platform"] | undefined;
  if (/facebook\.com|fb\.com/i.test(link)) guessedPlatform = "facebook";
  else if (/instagram\.com/i.test(link)) guessedPlatform = "instagram";
  else if (/tiktok\.com/i.test(link)) guessedPlatform = "tiktok";
  else if (/youtube\.com|youtu\.be/i.test(link)) guessedPlatform = "youtube";

  // No v1 não há scraping real. Tentamos deduzir um nome do domínio.
  let advertiser: string | undefined;
  try {
    const u = new URL(link);
    const host = u.hostname.replace(/^www\./, "");
    // Ad Library usa parâmetro ?id=; landing pages usam o próprio domínio.
    if (/facebook\.com/i.test(host)) {
      const id = u.searchParams.get("id") || u.searchParams.get("view_all_page_id");
      advertiser = id ? `Anunciante (page id ${id})` : undefined;
    } else {
      advertiser = host.split(".")[0].replace(/[-_]/g, " ");
    }
  } catch {
    /* link inválido — segue sem metadados */
  }

  return { advertiser, guessedPlatform, mock: true };
}

// --- Detecção de padrões / duplicatas -------------------------------------

export interface PatternInsights {
  topHooks: { label: string; count: number }[];
  lpByNiche: { niche: string; lp: string; count: number }[];
  totalOffers: number;
}

export function analyzePatterns(offers: Offer[]): PatternInsights {
  const hookCount = new Map<string, number>();
  const lpNiche = new Map<string, number>();

  for (const o of offers) {
    if (o.hook?.trim()) {
      const key = o.hook.trim();
      hookCount.set(key, (hookCount.get(key) ?? 0) + 1);
    }
    const niche = o.tags[0] ?? "sem nicho";
    const key = `${niche}||${o.landingPageType}`;
    lpNiche.set(key, (lpNiche.get(key) ?? 0) + 1);
  }

  const topHooks = [...hookCount.entries()]
    .map(([label, count]) => ({ label, count }))
    .filter((h) => h.count > 1)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const lpByNiche = [...lpNiche.entries()]
    .map(([k, count]) => {
      const [niche, lp] = k.split("||");
      return { niche, lp, count };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return { topHooks, lpByNiche, totalOffers: offers.length };
}

/** Similaridade simples por sobreposição de palavras (Jaccard) em nome+copy. */
export function findSimilar(
  candidate: { name: string; copy: string },
  offers: Offer[],
  threshold = 0.35,
): { offer: Offer; similarity: number }[] {
  const base = tokenize(`${candidate.name} ${candidate.copy}`);
  if (base.size === 0) return [];
  const out: { offer: Offer; similarity: number }[] = [];
  for (const o of offers) {
    const other = tokenize(`${o.name} ${o.copy}`);
    const sim = jaccard(base, other);
    if (sim >= threshold) out.push({ offer: o, similarity: sim });
  }
  return out.sort((a, b) => b.similarity - a.similarity).slice(0, 5);
}

// --- helpers ---------------------------------------------------------------

function tokenize(s: string): Set<string> {
  return new Set(
    s
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s]/gu, " ")
      .split(/\s+/)
      .filter((w) => w.length > 3),
  );
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let inter = 0;
  for (const x of a) if (b.has(x)) inter++;
  return inter / (a.size + b.size - inter);
}

function truncate(s: string, n: number): string {
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
}

function simplify(s: string): string {
  return s.replace(/^(pessoas|interessados|p[uú]blico)\s+(buscando|de|em)\s+/i, "");
}
