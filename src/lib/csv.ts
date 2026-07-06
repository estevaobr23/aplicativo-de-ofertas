import type {
  Offer,
  OfferDraft,
  CreativeType,
  LandingPageType,
  Platform,
  Objective,
  OfferStatus,
} from "./types";

// ---------------------------------------------------------------------------
// Import/Export CSV. Parser mínimo com suporte a campos entre aspas e vírgulas.
// ---------------------------------------------------------------------------

const COLUMNS = [
  "name",
  "product",
  "link",
  "thumbnailUrl",
  "creativeType",
  "status",
  "platform",
  "objective",
  "landingPageType",
  "tags",
  "hook",
  "copy",
  "cta",
  "audience",
  "notes",
  "originalDate",
] as const;

function esc(v: string): string {
  if (/[",\n]/.test(v)) return `"${v.replace(/"/g, '""')}"`;
  return v;
}

export function offersToCSV(offers: Offer[]): string {
  const header = COLUMNS.join(",");
  const rows = offers.map((o) =>
    COLUMNS.map((c) => {
      if (c === "tags") return esc(o.tags.join("; "));
      return esc(String(o[c as keyof Offer] ?? ""));
    }).join(","),
  );
  return [header, ...rows].join("\n");
}

// Parser tolerante a aspas e quebras de linha dentro de campos.
function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  const t = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  for (let i = 0; i < t.length; i++) {
    const ch = t[i];
    if (inQuotes) {
      if (ch === '"') {
        if (t[i + 1] === '"') {
          field += '"';
          i++;
        } else inQuotes = false;
      } else field += ch;
    } else if (ch === '"') inQuotes = true;
    else if (ch === ",") {
      row.push(field);
      field = "";
    } else if (ch === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else field += ch;
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((c) => c.trim() !== ""));
}

const CREATIVE: CreativeType[] = ["video", "imagem", "carrossel", "colecao"];
const LP: LandingPageType[] = [
  "vsl",
  "advertorial",
  "quiz",
  "pagina-de-vendas",
  "webinar",
  "lp-simples",
];
const PLATFORMS: Platform[] = [
  "facebook",
  "instagram",
  "tiktok",
  "youtube",
  "google",
  "outro",
];
const OBJECTIVES: Objective[] = [
  "conversao",
  "trafego",
  "engajamento",
  "vendas",
  "leads",
];
const STATUSES: OfferStatus[] = [
  "para-testar",
  "testando",
  "validada",
  "escalando",
  "descartada",
];

function coerce<T extends string>(v: string, allowed: T[], fallback: T): T {
  const norm = v.trim().toLowerCase() as T;
  return allowed.includes(norm) ? norm : fallback;
}

export interface CSVImportResult {
  drafts: OfferDraft[];
  errors: string[];
}

export function csvToDrafts(text: string): CSVImportResult {
  const rows = parseCSV(text);
  const errors: string[] = [];
  if (rows.length === 0) return { drafts: [], errors: ["Arquivo vazio"] };

  const header = rows[0].map((h) => h.trim().toLowerCase());
  const idx = (name: string) => header.indexOf(name.toLowerCase());
  const nameIdx = idx("name");
  if (nameIdx === -1) {
    return {
      drafts: [],
      errors: ['Coluna obrigatória "name" não encontrada no cabeçalho.'],
    };
  }

  const get = (row: string[], col: string) => {
    const i = idx(col);
    return i === -1 ? "" : (row[i] ?? "").trim();
  };

  const drafts: OfferDraft[] = [];
  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    const name = (row[nameIdx] ?? "").trim();
    if (!name) {
      errors.push(`Linha ${r + 1}: sem nome, ignorada.`);
      continue;
    }
    const tagsRaw = get(row, "tags");
    drafts.push({
      name,
      product: get(row, "product"),
      link: get(row, "link"),
      thumbnailUrl: get(row, "thumbnailUrl"),
      creativeType: coerce(get(row, "creativeType"), CREATIVE, "imagem"),
      status: coerce(get(row, "status"), STATUSES, "para-testar"),
      platform: coerce(get(row, "platform"), PLATFORMS, "facebook"),
      objective: coerce(get(row, "objective"), OBJECTIVES, "conversao"),
      landingPageType: coerce(get(row, "landingPageType"), LP, "lp-simples"),
      tags: tagsRaw
        ? tagsRaw
            .split(/[;,]/)
            .map((t) => t.trim())
            .filter(Boolean)
        : [],
      hook: get(row, "hook"),
      copy: get(row, "copy"),
      cta: get(row, "cta"),
      audience: get(row, "audience"),
      notes: get(row, "notes"),
      priorityPinned: false,
      originalDate: get(row, "originalDate") || undefined,
      attachments: [],
    });
  }
  return { drafts, errors };
}

export const CSV_TEMPLATE = COLUMNS.join(",") + "\n";
