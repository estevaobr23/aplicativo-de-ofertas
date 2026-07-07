"use client";

import Link from "next/link";
import type { Offer } from "@/lib/types";
import {
  StatusBadge,
  CreativeBadge,
  ActiveAdsRing,
  Thumb,
  fmtRelative,
} from "../ui";
import { LP_LABELS, activeAdsOf } from "@/lib/types";
import { IconEdit, IconCopy, IconTrash, IconStar } from "../icons";

export function ListView({
  offers,
  onEdit,
  onDuplicate,
  onDelete,
  onTogglePin,
}: {
  offers: Offer[];
  onEdit: (o: Offer) => void;
  onDuplicate: (o: Offer) => void;
  onDelete: (o: Offer) => void;
  onTogglePin: (o: Offer) => void;
}) {
  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-surface-2 text-left text-xs uppercase tracking-wide text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Oferta</th>
              <th className="px-3 py-3 font-medium">Status</th>
              <th className="px-3 py-3 font-medium">Criativo</th>
              <th className="px-3 py-3 font-medium">LP</th>
              <th className="px-3 py-3 font-medium">Tags</th>
              <th className="px-3 py-3 text-center font-medium">Anúncios</th>
              <th className="px-3 py-3 font-medium">Salva</th>
              <th className="px-3 py-3 text-right font-medium">Ações</th>
            </tr>
          </thead>
          <tbody>
            {offers.map((o) => (
              <tr
                key={o.id}
                className="border-b border-border/60 last:border-0 hover:bg-surface-2/50"
              >
                <td className="px-4 py-2.5">
                  <Link href={`/oferta/${o.id}`} className="flex items-center gap-3 group">
                    <Thumb
                      src={o.thumbnailUrl}
                      alt={o.name}
                      className="h-10 w-14 shrink-0 rounded-md"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1 font-medium group-hover:text-brand">
                        {o.priorityPinned && (
                          <IconStar width={13} height={13} className="text-brand" fill="currentColor" />
                        )}
                        <span className="line-clamp-1">{o.name}</span>
                      </div>
                      <span className="line-clamp-1 text-xs text-muted">
                        {o.product}
                      </span>
                    </div>
                  </Link>
                </td>
                <td className="px-3 py-2.5">
                  <StatusBadge status={o.status} />
                </td>
                <td className="px-3 py-2.5">
                  <CreativeBadge type={o.creativeType} />
                </td>
                <td className="px-3 py-2.5 text-muted">{LP_LABELS[o.landingPageType]}</td>
                <td className="px-3 py-2.5">
                  <div className="flex max-w-[160px] flex-wrap gap-1">
                    {o.tags.slice(0, 2).map((t) => (
                      <span key={t} className="text-[11px] text-brand">
                        #{t}
                      </span>
                    ))}
                    {o.tags.length > 2 && (
                      <span className="text-[11px] text-muted">+{o.tags.length - 2}</span>
                    )}
                  </div>
                </td>
                <td className="px-3 py-2.5">
                  <div className="flex justify-center">
                    <ActiveAdsRing count={activeAdsOf(o)} size={34} />
                  </div>
                </td>
                <td className="whitespace-nowrap px-3 py-2.5 text-xs text-muted">
                  {fmtRelative(o.createdAt)}
                </td>
                <td className="px-3 py-2.5">
                  <div className="flex justify-end gap-0.5">
                    <Act title="Fixar" onClick={() => onTogglePin(o)} active={o.priorityPinned}>
                      <IconStar width={15} height={15} />
                    </Act>
                    <Act title="Editar" onClick={() => onEdit(o)}>
                      <IconEdit width={15} height={15} />
                    </Act>
                    <Act title="Duplicar" onClick={() => onDuplicate(o)}>
                      <IconCopy width={15} height={15} />
                    </Act>
                    <Act title="Excluir" onClick={() => onDelete(o)} danger>
                      <IconTrash width={15} height={15} />
                    </Act>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Act({
  children,
  onClick,
  title,
  danger,
  active,
}: {
  children: React.ReactNode;
  onClick: () => void;
  title: string;
  danger?: boolean;
  active?: boolean;
}) {
  return (
    <button
      title={title}
      onClick={onClick}
      className={`rounded-md p-1.5 transition-colors ${
        danger
          ? "text-muted hover:bg-red-500/10 hover:text-red-500"
          : active
            ? "text-brand hover:bg-surface-2"
            : "text-muted hover:bg-surface-2 hover:text-fg"
      }`}
    >
      {children}
    </button>
  );
}
