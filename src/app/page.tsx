"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useStore, selectFilteredOffers } from "@/lib/store";
import type { Offer, OfferDraft } from "@/lib/types";
import { activeAdsOf } from "@/lib/types";
import { AppHeader } from "@/components/AppHeader";
import { FilterBar } from "@/components/FilterBar";
import { RemindersBanner } from "@/components/RemindersBanner";
import { GridView } from "@/components/views/GridView";
import { ListView } from "@/components/views/ListView";
import { KanbanView } from "@/components/views/KanbanView";
import { Modal } from "@/components/Modal";
import { OfferForm } from "@/components/OfferForm";
import { AutomationPanel } from "@/components/AutomationPanel";
import { EmptyState } from "@/components/ui";
import { IconGrid, IconList, IconKanban } from "@/components/icons";
import type { ViewMode } from "@/lib/store";

export default function DashboardPage() {
  const {
    offers,
    filters,
    view,
    ready,
    init,
    setView,
    createOffer,
    updateOffer,
    duplicateOffer,
    deleteOffer,
    setStatus,
    addAdCheck,
  } = useStore();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Offer | null>(null);
  const [automationOpen, setAutomationOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<Offer | null>(null);
  const submitRef = useRef<() => void>(() => {});

  useEffect(() => {
    init();
  }, [init]);

  const filtered = useMemo(
    () => selectFilteredOffers(offers, filters),
    [offers, filters],
  );

  function openNew() {
    setEditing(null);
    setFormOpen(true);
  }
  function openEdit(o: Offer) {
    setEditing(o);
    setFormOpen(true);
  }

  async function handleSubmit(draft: OfferDraft) {
    if (editing) {
      const { activeAds, ...rest } = draft;
      await updateOffer(editing.id, rest as Partial<Offer>);
      // Se mudou a contagem de anúncios ativos na edição, registra verificação.
      if (activeAds != null && activeAds >= 0 && activeAds !== activeAdsOf(editing)) {
        await addAdCheck(editing.id, activeAds, "manual");
      }
    } else {
      await createOffer(draft);
    }
    setFormOpen(false);
    setEditing(null);
  }

  async function togglePin(o: Offer) {
    await updateOffer(
      o.id,
      { priorityPinned: !o.priorityPinned },
      o.priorityPinned ? "Desafixada" : "Fixada como prioridade",
    );
  }

  return (
    <div className="min-h-screen">
      <AppHeader onNewOffer={openNew} onOpenAutomation={() => setAutomationOpen(true)} />

      <main className="mx-auto max-w-[1400px] space-y-4 px-4 py-5">
        <RemindersBanner />

        <StatCards />

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex-1">
            <FilterBar />
          </div>
          <ViewSwitch view={view} onChange={setView} />
        </div>

        <p className="text-sm text-muted">
          {filtered.length} de {offers.length} ofertas
        </p>

        {!ready ? (
          <div className="py-20 text-center text-muted">Carregando ofertas…</div>
        ) : filtered.length === 0 ? (
          <EmptyState
            title={offers.length === 0 ? "Nenhuma oferta ainda" : "Nada encontrado"}
            subtitle={
              offers.length === 0
                ? "Salve seu primeiro anúncio vencedor para começar seu banco de ofertas."
                : "Nenhuma oferta corresponde à busca/filtros atuais."
            }
            action={
              offers.length === 0 ? (
                <button className="btn-primary" onClick={openNew}>
                  + Nova oferta
                </button>
              ) : undefined
            }
          />
        ) : view === "grade" ? (
          <GridView
            offers={filtered}
            onEdit={openEdit}
            onDuplicate={(o) => duplicateOffer(o.id)}
            onDelete={setConfirmDelete}
            onTogglePin={togglePin}
            onSetThumbnail={(o, dataUrl) =>
              updateOffer(o.id, { thumbnailUrl: dataUrl }, "Imagem atualizada")
            }
          />
        ) : view === "lista" ? (
          <ListView
            offers={filtered}
            onEdit={openEdit}
            onDuplicate={(o) => duplicateOffer(o.id)}
            onDelete={setConfirmDelete}
            onTogglePin={togglePin}
          />
        ) : (
          <KanbanView offers={filtered} onStatusChange={setStatus} />
        )}
      </main>

      {/* Form modal */}
      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? "Editar oferta" : "Nova oferta"}
        wide
        footer={
          <>
            <button className="btn-ghost" onClick={() => setFormOpen(false)}>
              Cancelar
            </button>
            <button className="btn-primary" onClick={() => submitRef.current()}>
              {editing ? "Salvar alterações" : "Salvar oferta"}
            </button>
          </>
        }
      >
        <OfferForm
          initial={editing ?? undefined}
          onSubmit={handleSubmit}
          onCancelRef={(submit) => (submitRef.current = submit)}
        />
      </Modal>

      <AutomationPanel open={automationOpen} onClose={() => setAutomationOpen(false)} />

      {/* Confirm delete */}
      <Modal
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        title="Excluir oferta"
        footer={
          <>
            <button className="btn-ghost" onClick={() => setConfirmDelete(null)}>
              Cancelar
            </button>
            <button
              className="btn bg-red-500 text-white hover:bg-red-600"
              onClick={async () => {
                if (confirmDelete) await deleteOffer(confirmDelete.id);
                setConfirmDelete(null);
              }}
            >
              Excluir
            </button>
          </>
        }
      >
        <p className="text-sm text-muted">
          Tem certeza que deseja excluir{" "}
          <strong className="text-fg">{confirmDelete?.name}</strong>? Esta ação não
          pode ser desfeita.
        </p>
      </Modal>
    </div>
  );
}

function ViewSwitch({
  view,
  onChange,
}: {
  view: ViewMode;
  onChange: (v: ViewMode) => void;
}) {
  const opts: { key: ViewMode; label: string; icon: React.ReactNode }[] = [
    { key: "grade", label: "Grade", icon: <IconGrid width={16} height={16} /> },
    { key: "lista", label: "Lista", icon: <IconList width={16} height={16} /> },
    { key: "kanban", label: "Kanban", icon: <IconKanban width={16} height={16} /> },
  ];
  return (
    <div className="flex rounded-lg border border-border bg-surface p-0.5">
      {opts.map((o) => (
        <button
          key={o.key}
          onClick={() => onChange(o.key)}
          className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            view === o.key ? "bg-brand text-brand-fg" : "text-muted hover:text-fg"
          }`}
        >
          {o.icon}
          <span className="hidden sm:inline">{o.label}</span>
        </button>
      ))}
    </div>
  );
}

function StatCards() {
  const offers = useStore((s) => s.offers);
  const stats = useMemo(() => {
    return {
      total: offers.length,
      video: offers.filter((o) => o.creativeType === "video").length,
      imagem: offers.filter((o) => o.creativeType === "imagem").length,
      carrossel: offers.filter((o) => o.creativeType === "carrossel").length,
      comLink: offers.filter((o) => o.link.trim()).length,
      escalando: offers.filter((o) => o.status === "escalando").length,
    };
  }, [offers]);

  const cards = [
    { label: "Total", value: stats.total },
    { label: "Vídeos", value: stats.video },
    { label: "Imagens", value: stats.imagem },
    { label: "Carrosséis", value: stats.carrossel },
    { label: "Com link", value: stats.comLink },
    { label: "Escalando", value: stats.escalando, accent: true },
  ];

  return (
    <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
      {cards.map((c) => (
        <div key={c.label} className="card p-3">
          <div className={`text-2xl font-bold ${c.accent ? "text-brand" : ""}`}>
            {c.value}
          </div>
          <div className="text-xs text-muted">{c.label}</div>
        </div>
      ))}
    </div>
  );
}
