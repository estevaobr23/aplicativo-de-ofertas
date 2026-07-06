import { nanoid } from "nanoid";
import type { Offer } from "./types";
import { computeScore } from "./scoring";

// ---------------------------------------------------------------------------
// Dados de exemplo para o app não abrir vazio na primeira vez.
// ---------------------------------------------------------------------------

const daysAgo = (d: number) =>
  new Date(Date.now() - d * 86_400_000).toISOString().slice(0, 10);

type SeedInput = Omit<Offer, "score" | "createdAt" | "updatedAt"> & {
  createdOffsetDays: number;
};

const RAW: SeedInput[] = [
  {
    id: nanoid(),
    name: "Chá Seca-Barriga 21 dias",
    product: "Chá termogênico natural",
    link: "https://www.facebook.com/ads/library/?id=123456789",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=600&q=60",
    creativeType: "video",
    status: "escalando",
    platform: "facebook",
    objective: "conversao",
    landingPageType: "vsl",
    tags: ["emagrecimento", "brasil", "pt-br"],
    hook: "Descobri o segredo que emagrece sem dieta",
    copy: "Você vem tentando emagrecer e nada funciona? Descobri um método natural que derrete a gordura em 21 dias, sem dieta maluca e sem academia. Milhares de mulheres já comprovaram. Clique e veja como funciona agora.",
    cta: "Quero saber mais",
    audience: "Mulheres 30-55 buscando emagrecer",
    notes: "Rodando há semanas, muitos comentários. Testar hook alternativo.",
    priorityPinned: true,
    originalDate: daysAgo(72),
    attachments: [],
    history: [],
    adChecks: [
      { id: nanoid(), at: Date.now() - 5 * 86400000, activeAds: 8, source: "auto" },
      { id: nanoid(), at: Date.now() - 1 * 86400000, activeAds: 14, source: "auto" },
    ],
    createdOffsetDays: 6,
  },
  {
    id: nanoid(),
    name: "Método Renda nos Cliques",
    product: "Curso de renda extra online",
    link: "https://landingexemplo.com/renda-extra",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=600&q=60",
    creativeType: "imagem",
    status: "testando",
    platform: "instagram",
    objective: "leads",
    landingPageType: "advertorial",
    tags: ["renda extra", "financas", "brasil"],
    hook: "3 formas de ganhar sua primeira renda online",
    copy: "Você está fazendo tudo errado quando tenta ganhar dinheiro online. Existem 3 formas comprovadas de começar hoje mesmo, mesmo sem experiência. Descubra qual combina com você.",
    cta: "Fazer o teste",
    audience: "Pessoas buscando renda extra",
    notes: "Advertorial forte. Copiar estrutura de storytelling.",
    priorityPinned: false,
    originalDate: daysAgo(31),
    attachments: [],
    history: [],
    adChecks: [
      { id: nanoid(), at: Date.now() - 2 * 86400000, activeAds: 4, source: "manual" },
    ],
    createdOffsetDays: 3,
  },
  {
    id: nanoid(),
    name: "Sérum Anti-idade Glow",
    product: "Sérum facial",
    link: "https://www.facebook.com/ads/library/?id=987654321",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=600&q=60",
    creativeType: "carrossel",
    status: "para-testar",
    platform: "facebook",
    objective: "vendas",
    landingPageType: "pagina-de-vendas",
    tags: ["beleza", "estados unidos", "en"],
    hook: "As rugas somem em 7 dias?",
    copy: "Studies show this ingredient reduces wrinkles fast. See the before and after.",
    cta: "Shop now",
    audience: "Mulheres 40+ interessadas em beleza",
    notes: "Criativo em inglês, adaptar para PT.",
    priorityPinned: false,
    originalDate: daysAgo(12),
    attachments: [],
    history: [],
    adChecks: [],
    createdOffsetDays: 1,
  },
  {
    id: nanoid(),
    name: "Quiz do Sono Perfeito",
    product: "Suplemento para dormir",
    link: "https://quizsono.com/start",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?w=600&q=60",
    creativeType: "video",
    status: "validada",
    platform: "facebook",
    objective: "conversao",
    landingPageType: "quiz",
    tags: ["saude", "brasil", "pt-br"],
    hook: "Você acorda cansado? Faça este teste de 30s",
    copy: "Ansiedade e noites mal dormidas acabam com a sua energia. Faça este teste rápido e descubra o que está sabotando o seu sono. Comprovado por especialistas.",
    cta: "Fazer o teste",
    audience: "Adultos com problemas de sono/ansiedade",
    notes: "Quiz converte muito bem. Já validado, considerar escalar.",
    priorityPinned: false,
    originalDate: daysAgo(45),
    attachments: [],
    history: [],
    adChecks: [
      { id: nanoid(), at: Date.now() - 4 * 86400000, activeAds: 6, source: "auto" },
      { id: nanoid(), at: Date.now() - 1 * 86400000, activeAds: 6, source: "auto" },
    ],
    createdOffsetDays: 10,
  },
  {
    id: nanoid(),
    name: "Adestramento Inteligente",
    product: "Ebook de adestramento canino",
    link: "https://www.facebook.com/ads/library/?id=555444333",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=600&q=60",
    creativeType: "video",
    status: "descartada",
    platform: "facebook",
    objective: "trafego",
    landingPageType: "lp-simples",
    tags: ["pets", "brasil"],
    hook: "Seu cachorro para de latir em 5 passos",
    copy: "Cansado do seu cachorro latindo sem parar? Aprenda 5 passos simples.",
    cta: "Baixar agora",
    audience: "Donos de cães",
    notes: "LP fraca, criativo genérico. Descartado.",
    priorityPinned: false,
    originalDate: daysAgo(20),
    attachments: [],
    history: [],
    adChecks: [],
    createdOffsetDays: 8,
  },
];

export function buildSeedOffers(): Offer[] {
  return RAW.map((r) => {
    const { createdOffsetDays, ...rest } = r;
    const createdAt = Date.now() - createdOffsetDays * 86_400_000;
    const offer: Offer = {
      ...rest,
      createdAt,
      updatedAt: createdAt,
      score: 0,
      history: [
        {
          id: nanoid(),
          at: createdAt,
          message: "Oferta salva (exemplo)",
        },
      ],
    };
    offer.score = computeScore(offer);
    return offer;
  });
}
