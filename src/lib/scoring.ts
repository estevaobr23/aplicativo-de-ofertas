import type { Offer, OfferDraft } from "./types";

// ---------------------------------------------------------------------------
// Score de prioridade de teste (0-100). Heurística transparente e ajustável.
// Critérios pensados para "vale a pena testar essa oferta primeiro?".
// ---------------------------------------------------------------------------

export interface ScoreBreakdown {
  total: number;
  parts: { label: string; points: number; max: number }[];
}

const NICHOS_QUENTES = [
  "emagrecimento",
  "saude",
  "beleza",
  "financas",
  "renda extra",
  "relacionamento",
  "pets",
  "espiritualidade",
];

const LP_FORTES = ["vsl", "advertorial", "quiz", "webinar"];

/** Dias que o anúncio está ativo (se houver data original). */
function daysActive(originalDate?: string): number | null {
  if (!originalDate) return null;
  const start = new Date(originalDate).getTime();
  if (Number.isNaN(start)) return null;
  return Math.max(0, Math.floor((Date.now() - start) / 86_400_000));
}

export function computeScoreBreakdown(
  offer: Pick<
    Offer,
    | "originalDate"
    | "link"
    | "landingPageType"
    | "tags"
    | "copy"
    | "hook"
    | "adChecks"
  > & { adChecks?: Offer["adChecks"] },
): ScoreBreakdown {
  const parts: ScoreBreakdown["parts"] = [];

  // 1. Tempo ativo — anúncio rodando há muito tempo = validado pelo mercado.
  const days = daysActive(offer.originalDate);
  let timePts = 0;
  if (days !== null) {
    if (days >= 60) timePts = 30;
    else if (days >= 30) timePts = 24;
    else if (days >= 14) timePts = 16;
    else if (days >= 7) timePts = 10;
    else timePts = 4;
  }
  parts.push({ label: "Tempo ativo", points: timePts, max: 30 });

  // 2. Qualidade da página / link presente.
  let lpPts = 0;
  if (offer.link?.trim()) lpPts += 8;
  if (LP_FORTES.includes(offer.landingPageType)) lpPts += 12;
  parts.push({ label: "Link + tipo de LP", points: Math.min(lpPts, 20), max: 20 });

  // 3. Nicho de interesse.
  const tagsLower = (offer.tags ?? []).map((t) => t.toLowerCase());
  const nichoMatch = NICHOS_QUENTES.some((n) =>
    tagsLower.some((t) => t.includes(n)),
  );
  parts.push({
    label: "Nicho de interesse",
    points: nichoMatch ? 15 : 0,
    max: 15,
  });

  // 4. Riqueza da copy (temos material pra estudar/adaptar?).
  const copyLen = (offer.copy ?? "").trim().length;
  let copyPts = 0;
  if (copyLen > 400) copyPts = 15;
  else if (copyLen > 150) copyPts = 10;
  else if (copyLen > 30) copyPts = 5;
  if ((offer.hook ?? "").trim().length > 10) copyPts = Math.min(copyPts + 5, 20);
  parts.push({ label: "Riqueza da copy", points: Math.min(copyPts, 20), max: 20 });

  // 5. Sinal de escala (tendência de anúncios ativos subindo).
  const checks = offer.adChecks ?? [];
  let scalePts = 0;
  if (checks.length >= 2) {
    const sorted = [...checks].sort((a, b) => a.at - b.at);
    const first = sorted[0].activeAds;
    const last = sorted[sorted.length - 1].activeAds;
    if (last > first) scalePts = 15;
    else if (last === first) scalePts = 8;
    else scalePts = 3;
  } else if (checks.length === 1) {
    scalePts = checks[0].activeAds > 5 ? 10 : 5;
  }
  parts.push({ label: "Sinal de escala", points: scalePts, max: 15 });

  const total = Math.min(
    100,
    parts.reduce((s, p) => s + p.points, 0),
  );
  return { total, parts };
}

export function computeScore(
  offer: Parameters<typeof computeScoreBreakdown>[0],
): number {
  return computeScoreBreakdown(offer).total;
}

/** Usado ao salvar um draft (sem adChecks ainda). */
export function scoreFromDraft(draft: OfferDraft): number {
  return computeScore({
    originalDate: draft.originalDate,
    link: draft.link,
    landingPageType: draft.landingPageType,
    tags: draft.tags,
    copy: draft.copy,
    hook: draft.hook,
    adChecks: [],
  });
}
