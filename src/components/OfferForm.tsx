"use client";

import { useEffect, useMemo, useState } from "react";
import type {
  Offer,
  OfferDraft,
  CreativeType,
  LandingPageType,
  Platform,
  Objective,
  OfferStatus,
} from "@/lib/types";
import {
  CREATIVE_TYPE_LABELS,
  LP_LABELS,
  PLATFORM_LABELS,
  OBJECTIVE_LABELS,
  STATUS_LABELS,
  OFFER_STATUSES,
} from "@/lib/types";
import { useStore } from "@/lib/store";
import { extractLinkMetadata, findSimilar } from "@/lib/aiService";
import { IconSparkles, IconLink, IconAlert } from "./icons";

const empty: OfferDraft = {
  name: "",
  product: "",
  link: "",
  thumbnailUrl: "",
  creativeType: "video",
  status: "para-testar",
  platform: "facebook",
  objective: "conversao",
  landingPageType: "vsl",
  tags: [],
  hook: "",
  copy: "",
  cta: "",
  audience: "",
  notes: "",
  priorityPinned: false,
  originalDate: "",
  attachments: [],
};

export function OfferForm({
  initial,
  onSubmit,
  onCancelRef,
}: {
  initial?: Offer;
  onSubmit: (draft: OfferDraft) => void | Promise<void>;
  /** o pai registra aqui a função de submit para o botão do rodapé */
  onCancelRef?: (submit: () => void) => void;
}) {
  const offers = useStore((s) => s.offers);
  const [draft, setDraft] = useState<OfferDraft>(() =>
    initial ? toDraft(initial) : empty,
  );
  const [showAdvanced, setShowAdvanced] = useState(!!initial);
  const [tagInput, setTagInput] = useState("");
  const [extracting, setExtracting] = useState(false);
  const [extractNote, setExtractNote] = useState("");

  const set = <K extends keyof OfferDraft>(k: K, v: OfferDraft[K]) =>
    setDraft((d) => ({ ...d, [k]: v }));

  // Detecção de possíveis duplicatas (não bloqueia, só avisa).
  const similar = useMemo(() => {
    if (draft.name.trim().length < 3 && draft.copy.trim().length < 10) return [];
    return findSimilar(
      { name: draft.name, copy: draft.copy },
      offers.filter((o) => o.id !== initial?.id),
    );
  }, [draft.name, draft.copy, offers, initial?.id]);

  // registra o submit no pai
  useEffect(() => {
    onCancelRef?.(() => submit());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft]);

  async function handleExtract() {
    if (!draft.link.trim()) return;
    setExtracting(true);
    setExtractNote("");
    try {
      const meta = await extractLinkMetadata(draft.link);
      const applied: string[] = [];
      if (meta.guessedPlatform) {
        set("platform", meta.guessedPlatform);
        applied.push("plataforma");
      }
      if (meta.advertiser && !draft.name.trim()) {
        set("name", capitalize(meta.advertiser));
        applied.push("nome");
      }
      if (meta.thumbnailUrl && !draft.thumbnailUrl) {
        set("thumbnailUrl", meta.thumbnailUrl);
        applied.push("thumbnail");
      }
      setExtractNote(
        applied.length
          ? `Pré-preenchido (mock): ${applied.join(", ")}. Ajuste como quiser.`
          : "Nada extraído automaticamente deste link (mock). Preencha manualmente.",
      );
    } finally {
      setExtracting(false);
    }
  }

  function addTag(raw: string) {
    const t = raw.trim().toLowerCase();
    if (t && !draft.tags.includes(t)) set("tags", [...draft.tags, t]);
    setTagInput("");
  }

  function submit() {
    if (!draft.name.trim()) {
      alert("Dê um nome à oferta.");
      return;
    }
    onSubmit({ ...draft, name: draft.name.trim() });
  }

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      {/* Cadastro rápido: link + extração */}
      <div>
        <label className="label">Link (Ad Library / anúncio / landing page)</label>
        <div className="flex gap-2">
          <input
            className="input"
            placeholder="https://facebook.com/ads/library/?id=…"
            value={draft.link}
            onChange={(e) => set("link", e.target.value)}
          />
          <button
            type="button"
            className="btn-outline whitespace-nowrap"
            onClick={handleExtract}
            disabled={extracting || !draft.link.trim()}
            title="Extrair metadados do link (mock no v1)"
          >
            <IconLink />
            {extracting ? "…" : "Extrair"}
          </button>
        </div>
        {extractNote && (
          <p className="mt-1 text-xs text-muted">{extractNote}</p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label">Nome da oferta *</label>
          <input
            className="input"
            value={draft.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="Ex: Chá Seca-Barriga 21 dias"
            autoFocus
          />
        </div>
        <div>
          <label className="label">Produto</label>
          <input
            className="input"
            value={draft.product}
            onChange={(e) => set("product", e.target.value)}
            placeholder="Ex: Chá termogênico"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Select
          label="Tipo de criativo"
          value={draft.creativeType}
          onChange={(v) => set("creativeType", v as CreativeType)}
          options={Object.entries(CREATIVE_TYPE_LABELS)}
        />
        <Select
          label="Tipo de LP"
          value={draft.landingPageType}
          onChange={(v) => set("landingPageType", v as LandingPageType)}
          options={Object.entries(LP_LABELS)}
        />
        <Select
          label="Status"
          value={draft.status}
          onChange={(v) => set("status", v as OfferStatus)}
          options={OFFER_STATUSES.map((s) => [s, STATUS_LABELS[s]])}
        />
      </div>

      {/* Tags */}
      <div>
        <label className="label">Tags (nicho, país, idioma…)</label>
        <div className="flex flex-wrap gap-1.5">
          {draft.tags.map((t) => (
            <button
              key={t}
              type="button"
              className="chip chip-active"
              onClick={() => set("tags", draft.tags.filter((x) => x !== t))}
              title="Remover"
            >
              {t} ✕
            </button>
          ))}
          <input
            className="input !w-auto flex-1 min-w-[140px]"
            placeholder="Digite e Enter"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === ",") {
                e.preventDefault();
                addTag(tagInput);
              }
            }}
          />
        </div>
      </div>

      {/* Copy — importante para o assistente */}
      <div>
        <label className="label">Copy principal</label>
        <textarea
          className="input min-h-[90px] resize-y"
          value={draft.copy}
          onChange={(e) => set("copy", e.target.value)}
          placeholder="Cole aqui o texto do anúncio…"
        />
      </div>

      {/* Aviso de duplicata */}
      {similar.length > 0 && (
        <div className="rounded-lg border border-amber-400/40 bg-amber-400/10 p-3 text-sm">
          <div className="flex items-center gap-2 font-medium text-amber-500">
            <IconAlert width={16} height={16} />
            Ofertas parecidas já salvas
          </div>
          <ul className="mt-1 space-y-0.5 text-muted">
            {similar.map((s) => (
              <li key={s.offer.id}>
                • {s.offer.name}{" "}
                <span className="opacity-60">
                  ({Math.round(s.similarity * 100)}% similar)
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Avançado */}
      <button
        type="button"
        className="text-sm font-medium text-brand hover:underline"
        onClick={() => setShowAdvanced((v) => !v)}
      >
        {showAdvanced ? "− Ocultar campos avançados" : "+ Mais campos (gancho, público, CTA, notas…)"}
      </button>

      {showAdvanced && (
        <div className="space-y-4 border-t border-border pt-4">
          <div>
            <label className="label">Gancho / ângulo criativo</label>
            <input
              className="input"
              value={draft.hook}
              onChange={(e) => set("hook", e.target.value)}
              placeholder="Ex: Descobri o segredo que emagrece sem dieta"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Call-to-action</label>
              <input
                className="input"
                value={draft.cta}
                onChange={(e) => set("cta", e.target.value)}
                placeholder="Ex: Quero saber mais"
              />
            </div>
            <div>
              <label className="label">Público-alvo</label>
              <input
                className="input"
                value={draft.audience}
                onChange={(e) => set("audience", e.target.value)}
                placeholder="Ex: Mulheres 30-55"
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <Select
              label="Plataforma"
              value={draft.platform}
              onChange={(v) => set("platform", v as Platform)}
              options={Object.entries(PLATFORM_LABELS)}
            />
            <Select
              label="Objetivo"
              value={draft.objective}
              onChange={(v) => set("objective", v as Objective)}
              options={Object.entries(OBJECTIVE_LABELS)}
            />
            <div>
              <label className="label">Data original do anúncio</label>
              <input
                type="date"
                className="input"
                value={draft.originalDate ?? ""}
                onChange={(e) => set("originalDate", e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="label">URL da thumbnail</label>
            <input
              className="input"
              value={draft.thumbnailUrl}
              onChange={(e) => set("thumbnailUrl", e.target.value)}
              placeholder="https://…/imagem.jpg"
            />
          </div>
          <div>
            <label className="label">Notas de performance</label>
            <textarea
              className="input min-h-[70px] resize-y"
              value={draft.notes}
              onChange={(e) => set("notes", e.target.value)}
              placeholder="O que observou sobre a performance…"
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={draft.priorityPinned}
              onChange={(e) => set("priorityPinned", e.target.checked)}
            />
            Fixar no topo (alta prioridade)
          </label>
        </div>
      )}

      <p className="flex items-center gap-1.5 text-xs text-muted">
        <IconSparkles width={14} height={14} />
        Dica: preencha a copy e use o botão “Analisar copy” na página de detalhe
        para sugestões de gancho, público e variações.
      </p>
    </form>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: [string, string][];
}) {
  return (
    <div>
      <label className="label">{label}</label>
      <select
        className="input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
    </div>
  );
}

function toDraft(o: Offer): OfferDraft {
  return {
    name: o.name,
    product: o.product,
    link: o.link,
    thumbnailUrl: o.thumbnailUrl,
    creativeType: o.creativeType,
    status: o.status,
    platform: o.platform,
    objective: o.objective,
    landingPageType: o.landingPageType,
    tags: [...o.tags],
    hook: o.hook,
    copy: o.copy,
    cta: o.cta,
    audience: o.audience,
    notes: o.notes,
    priorityPinned: o.priorityPinned,
    originalDate: o.originalDate ?? "",
    attachments: o.attachments,
  };
}

function capitalize(s: string): string {
  return s.replace(/\b\w/g, (c) => c.toUpperCase());
}
