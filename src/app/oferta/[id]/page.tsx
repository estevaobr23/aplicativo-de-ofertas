"use client";

import { use, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import type { Offer, OfferDraft, OfferStatus, Attachment } from "@/lib/types";
import {
  STATUS_LABELS,
  OFFER_STATUSES,
  CREATIVE_TYPE_LABELS,
  LP_LABELS,
  PLATFORM_LABELS,
  OBJECTIVE_LABELS,
} from "@/lib/types";
import { repository } from "@/lib/repository";
import { computeScoreBreakdown } from "@/lib/scoring";
import { nanoid } from "nanoid";
import { AppHeader } from "@/components/AppHeader";
import { Modal } from "@/components/Modal";
import { OfferForm } from "@/components/OfferForm";
import { CopyAnalysisPanel } from "@/components/CopyAnalysisPanel";
import { WorkflowChecklist } from "@/components/WorkflowChecklist";
import { StatusBadge, Thumb, ScoreRing, fmtDate, fmtRelative } from "@/components/ui";
import { IconBack, IconEdit, IconCopy, IconTrash, IconLink, IconStar } from "@/components/icons";
import { AdChecksChart } from "@/components/AdChecksChart";

export default function OfferDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const {
    offers,
    ready,
    init,
    updateOffer,
    duplicateOffer,
    deleteOffer,
    setStatus,
    refresh,
  } = useStore();

  const [editOpen, setEditOpen] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);
  const submitRef = useRef<() => void>(() => {});
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    init();
  }, [init]);

  const offer = useMemo(() => offers.find((o) => o.id === id), [offers, id]);

  const breakdown = useMemo(
    () => (offer ? computeScoreBreakdown(offer) : null),
    [offer],
  );

  if (!ready) {
    return (
      <div className="min-h-screen">
        <AppHeader />
        <div className="py-20 text-center text-muted">Carregando…</div>
      </div>
    );
  }

  if (!offer) {
    return (
      <div className="min-h-screen">
        <AppHeader />
        <div className="mx-auto max-w-2xl px-4 py-20 text-center">
          <p className="text-lg font-medium">Oferta não encontrada</p>
          <Link href="/" className="btn-primary mt-4 inline-flex">
            <IconBack width={16} height={16} /> Voltar ao banco
          </Link>
        </div>
      </div>
    );
  }

  async function handleEdit(draft: OfferDraft) {
    await updateOffer(offer!.id, draft as Partial<Offer>);
    setEditOpen(false);
  }

  async function handleAddAttachment(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    const atts: Attachment[] = [];
    for (const f of files) {
      const dataUrl = await fileToDataUrl(f);
      atts.push({ id: nanoid(), dataUrl, name: f.name, addedAt: Date.now() });
    }
    await updateOffer(
      offer!.id,
      { attachments: [...offer!.attachments, ...atts] },
      `${atts.length} anexo(s) adicionado(s)`,
    );
    if (fileRef.current) fileRef.current.value = "";
  }

  async function removeAttachment(attId: string) {
    await updateOffer(
      offer!.id,
      { attachments: offer!.attachments.filter((a) => a.id !== attId) },
      "Anexo removido",
    );
  }

  return (
    <div className="min-h-screen">
      <AppHeader />

      <main className="mx-auto max-w-[1200px] px-4 py-5">
        {/* Top bar */}
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <Link href="/" className="btn-ghost">
            <IconBack width={16} height={16} /> Voltar
          </Link>
          <div className="ml-auto flex flex-wrap gap-1.5">
            <button
              className="btn-outline"
              onClick={() =>
                updateOffer(
                  offer.id,
                  { priorityPinned: !offer.priorityPinned },
                  offer.priorityPinned ? "Desafixada" : "Fixada como prioridade",
                )
              }
            >
              <IconStar width={16} height={16} className={offer.priorityPinned ? "text-brand" : ""} />
              {offer.priorityPinned ? "Fixada" : "Fixar"}
            </button>
            <button className="btn-outline" onClick={() => setEditOpen(true)}>
              <IconEdit width={16} height={16} /> Editar
            </button>
            <button
              className="btn-outline"
              onClick={async () => {
                const dup = await duplicateOffer(offer.id);
                void dup;
              }}
            >
              <IconCopy width={16} height={16} /> Duplicar
            </button>
            <button className="btn-outline text-red-500" onClick={() => setConfirmDel(true)}>
              <IconTrash width={16} height={16} /> Excluir
            </button>
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-[1.6fr_1fr]">
          {/* Coluna principal */}
          <div className="space-y-5">
            {/* Header da oferta */}
            <div className="card overflow-hidden">
              <Thumb src={offer.thumbnailUrl} alt={offer.name} className="aspect-[2/1]" />
              <div className="p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge status={offer.status} />
                  <span className="chip bg-surface-2 border-transparent text-muted">
                    {CREATIVE_TYPE_LABELS[offer.creativeType]}
                  </span>
                  <span className="chip bg-surface-2 border-transparent text-muted">
                    {LP_LABELS[offer.landingPageType]}
                  </span>
                  <span className="chip bg-surface-2 border-transparent text-muted">
                    {PLATFORM_LABELS[offer.platform]}
                  </span>
                  <span className="chip bg-surface-2 border-transparent text-muted">
                    {OBJECTIVE_LABELS[offer.objective]}
                  </span>
                </div>
                <h1 className="mt-3 text-2xl font-bold">{offer.name}</h1>
                {offer.product && <p className="text-muted">{offer.product}</p>}

                {offer.tags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {offer.tags.map((t) => (
                      <span key={t} className="chip chip-active">
                        #{t}
                      </span>
                    ))}
                  </div>
                )}

                {offer.link && (
                  <a
                    href={offer.link}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-outline mt-3 inline-flex"
                  >
                    <IconLink width={16} height={16} /> Abrir link original
                  </a>
                )}
              </div>
            </div>

            {/* Status switcher rápido */}
            <div className="card p-4">
              <p className="label">Mover status</p>
              <div className="flex flex-wrap gap-1.5">
                {OFFER_STATUSES.map((s) => (
                  <button
                    key={s}
                    className={`chip ${offer.status === s ? "chip-active" : ""}`}
                    onClick={() => setStatus(offer.id, s)}
                  >
                    {STATUS_LABELS[s]}
                  </button>
                ))}
              </div>
            </div>

            {/* Campos de conteúdo */}
            <div className="card space-y-4 p-4">
              <FieldBlock label="Gancho / ângulo criativo" value={offer.hook} />
              <FieldBlock label="Copy principal" value={offer.copy} pre />
              <div className="grid gap-4 sm:grid-cols-2">
                <FieldBlock label="Call-to-action" value={offer.cta} />
                <FieldBlock label="Público-alvo" value={offer.audience} />
              </div>
              <FieldBlock label="Notas de performance" value={offer.notes} pre />
            </div>

            {/* Assistente de copy (P2) */}
            <CopyAnalysisPanel
              copy={offer.copy}
              onApplyHook={(hook) => updateOffer(offer.id, { hook }, "Gancho aplicado pelo assistente")}
              onApplyAudience={(audience) =>
                updateOffer(offer.id, { audience }, "Público aplicado pelo assistente")
              }
            />

            {/* Anexos / variações */}
            <div className="card p-4">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-semibold">Prints / variações do criativo</h3>
                <button className="btn-outline" onClick={() => fileRef.current?.click()}>
                  + Adicionar
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleAddAttachment}
                />
              </div>
              {offer.attachments.length === 0 ? (
                <p className="text-sm text-muted">
                  Nenhum anexo. Adicione prints do criativo ou variações que você
                  criou.
                </p>
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {offer.attachments.map((a) => (
                    <div key={a.id} className="group relative overflow-hidden rounded-lg border border-border">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={a.dataUrl} alt={a.name} className="aspect-square w-full object-cover" />
                      <button
                        className="absolute right-1 top-1 rounded-md bg-black/60 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
                        onClick={() => removeAttachment(a.id)}
                        title="Remover"
                      >
                        <IconTrash width={14} height={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Coluna lateral */}
          <div className="space-y-5">
            {/* Score */}
            <div className="card p-4">
              <div className="flex items-center gap-3">
                <ScoreRing score={offer.score} size={56} />
                <div>
                  <p className="font-semibold">Score de prioridade</p>
                  <p className="text-xs text-muted">
                    Calculado a partir dos critérios abaixo.
                  </p>
                </div>
              </div>
              {breakdown && (
                <div className="mt-3 space-y-2">
                  {breakdown.parts.map((p) => (
                    <div key={p.label}>
                      <div className="flex justify-between text-xs">
                        <span className="text-muted">{p.label}</span>
                        <span className="font-medium">
                          {p.points}/{p.max}
                        </span>
                      </div>
                      <div className="mt-0.5 h-1.5 overflow-hidden rounded-full bg-surface-2">
                        <div
                          className="h-full rounded-full bg-brand"
                          style={{ width: `${(p.points / p.max) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <WorkflowChecklist offerId={offer.id} />

            {/* Monitoramento de anúncios */}
            <div className="card p-4">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="font-semibold">Anúncios ativos</h3>
                <AddCheckButton offerId={offer.id} onDone={refresh} />
              </div>
              {offer.adChecks.length === 0 ? (
                <p className="text-sm text-muted">
                  Sem verificações ainda. Use “+ Registrar” ou a automação.
                </p>
              ) : (
                <AdChecksChart checks={offer.adChecks} />
              )}
            </div>

            {/* Metadados */}
            <div className="card p-4 text-sm">
              <h3 className="mb-2 font-semibold">Detalhes</h3>
              <MetaRow label="Data original" value={offer.originalDate ? fmtDate(offer.originalDate) : "—"} />
              <MetaRow label="Salva em" value={fmtDate(offer.createdAt)} />
              <MetaRow label="Atualizada" value={fmtRelative(offer.updatedAt)} />
            </div>

            {/* Histórico */}
            <div className="card p-4">
              <h3 className="mb-2 font-semibold">Histórico de edições</h3>
              <ul className="space-y-2">
                {offer.history.map((h) => (
                  <li key={h.id} className="flex gap-2 text-sm">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
                    <div>
                      <p>{h.message}</p>
                      <p className="text-xs text-muted">{fmtRelative(h.at)}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </main>

      {/* Editar */}
      <Modal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title="Editar oferta"
        wide
        footer={
          <>
            <button className="btn-ghost" onClick={() => setEditOpen(false)}>
              Cancelar
            </button>
            <button className="btn-primary" onClick={() => submitRef.current()}>
              Salvar alterações
            </button>
          </>
        }
      >
        <OfferForm
          initial={offer}
          onSubmit={handleEdit}
          onCancelRef={(submit) => (submitRef.current = submit)}
        />
      </Modal>

      {/* Excluir */}
      <Modal
        open={confirmDel}
        onClose={() => setConfirmDel(false)}
        title="Excluir oferta"
        footer={
          <>
            <button className="btn-ghost" onClick={() => setConfirmDel(false)}>
              Cancelar
            </button>
            <button
              className="btn bg-red-500 text-white hover:bg-red-600"
              onClick={async () => {
                await deleteOffer(offer.id);
                router.push("/");
              }}
            >
              Excluir
            </button>
          </>
        }
      >
        <p className="text-sm text-muted">
          Excluir <strong className="text-fg">{offer.name}</strong>? Esta ação não
          pode ser desfeita.
        </p>
      </Modal>
    </div>
  );
}

function FieldBlock({
  label,
  value,
  pre,
}: {
  label: string;
  value: string;
  pre?: boolean;
}) {
  return (
    <div>
      <p className="label">{label}</p>
      {value?.trim() ? (
        <p className={`text-sm ${pre ? "whitespace-pre-wrap" : ""}`}>{value}</p>
      ) : (
        <p className="text-sm text-muted">—</p>
      )}
    </div>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b border-border/60 py-1.5 last:border-0">
      <span className="text-muted">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function AddCheckButton({
  offerId,
  onDone,
}: {
  offerId: string;
  onDone: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [val, setVal] = useState("");
  return (
    <>
      <button className="btn-outline !py-1 !text-xs" onClick={() => setOpen(true)}>
        + Registrar
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title="Registrar contagem de anúncios">
        <div className="space-y-3">
          <div>
            <label className="label">Nº de anúncios ativos hoje</label>
            <input
              type="number"
              min={0}
              className="input"
              value={val}
              onChange={(e) => setVal(e.target.value)}
              autoFocus
            />
          </div>
          <button
            className="btn-primary w-full"
            onClick={async () => {
              const n = parseInt(val, 10);
              if (!Number.isNaN(n)) {
                await repository.addAdCheck(offerId, { activeAds: n, source: "manual" });
                await onDone();
              }
              setVal("");
              setOpen(false);
            }}
          >
            Registrar
          </button>
        </div>
      </Modal>
    </>
  );
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
