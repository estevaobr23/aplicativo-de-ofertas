"use client";

import { useRef, useState } from "react";
import { useStore } from "@/lib/store";
import { offersToCSV, csvToDrafts, CSV_TEMPLATE } from "@/lib/csv";
import { repository } from "@/lib/repository";
import { selectFilteredOffers } from "@/lib/store";
import { Modal } from "./Modal";
import { IconUpload, IconDownload } from "./icons";

export function ImportExport() {
  const offers = useStore((s) => s.offers);
  const filters = useStore((s) => s.filters);
  const refresh = useStore((s) => s.refresh);
  const fileRef = useRef<HTMLInputElement>(null);
  const [result, setResult] = useState<{ added: number; errors: string[] } | null>(null);
  const [showImport, setShowImport] = useState(false);

  function download(name: string, content: string) {
    const blob = new Blob([content], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
  }

  function exportFiltered() {
    const filtered = selectFilteredOffers(offers, filters);
    download(`swipe-vault-${Date.now()}.csv`, offersToCSV(filtered));
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const { drafts, errors } = csvToDrafts(text);
    let added = 0;
    if (drafts.length) added = await repository.bulkCreate(drafts);
    await refresh();
    setResult({ added, errors });
    if (fileRef.current) fileRef.current.value = "";
  }

  return (
    <>
      <button className="btn-ghost" onClick={() => setShowImport(true)} title="Importar/Exportar CSV">
        <IconUpload width={16} height={16} />
        <span className="hidden md:inline">Importar / Exportar</span>
      </button>

      <Modal open={showImport} onClose={() => setShowImport(false)} title="Importar / Exportar CSV">
        <div className="space-y-5 text-sm">
          <section>
            <h3 className="font-medium">Importar em massa</h3>
            <p className="mt-1 text-muted">
              Envie um CSV com no mínimo a coluna <code className="rounded bg-surface-2 px-1">name</code>.
              Colunas reconhecidas: name, product, link, thumbnailUrl, creativeType,
              status, platform, objective, landingPageType, tags, hook, copy, cta,
              audience, notes, originalDate. Tags separadas por “;”.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button className="btn-primary" onClick={() => fileRef.current?.click()}>
                <IconUpload width={16} height={16} /> Escolher arquivo CSV
              </button>
              <button
                className="btn-outline"
                onClick={() => download("modelo-swipe-vault.csv", CSV_TEMPLATE)}
              >
                <IconDownload width={16} height={16} /> Baixar modelo
              </button>
              <input
                ref={fileRef}
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={handleFile}
              />
            </div>
            {result && (
              <div className="mt-3 rounded-lg bg-surface-2 p-3">
                <p className="font-medium text-green-500">
                  {result.added} oferta(s) importada(s).
                </p>
                {result.errors.length > 0 && (
                  <ul className="mt-1 max-h-24 overflow-y-auto text-xs text-muted">
                    {result.errors.map((e, i) => (
                      <li key={i}>• {e}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </section>

          <section className="border-t border-border pt-4">
            <h3 className="font-medium">Exportar</h3>
            <p className="mt-1 text-muted">
              Exporta as ofertas atualmente visíveis (respeitando busca e filtros)
              para compartilhar com o time.
            </p>
            <button className="btn-outline mt-3" onClick={exportFiltered}>
              <IconDownload width={16} height={16} /> Exportar filtradas (CSV)
            </button>
          </section>
        </div>
      </Modal>
    </>
  );
}
