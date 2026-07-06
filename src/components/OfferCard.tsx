"use client";

import Link from "next/link";
import type { Offer } from "@/lib/types";
import { PLATFORM_LABELS } from "@/lib/types";
import {
  StatusBadge,
  CreativeBadge,
  LpBadge,
  ScoreRing,
  Thumb,
  fmtRelative,
} from "./ui";
import { IconEdit, IconCopy, IconTrash, IconStar } from "./icons";

export function OfferCard({
  offer,
  onEdit,
  onDuplicate,
  onDelete,
  onTogglePin,
}: {
  offer: Offer;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onTogglePin: () => void;
}) {
  return (
    <div className="card group flex flex-col overflow-hidden transition-shadow hover:shadow-lg">
      <Link href={`/oferta/${offer.id}`} className="relative block">
        <Thumb src={offer.thumbnailUrl} alt={offer.name} className="aspect-video" />
        <div className="absolute left-2 top-2">
          <StatusBadge status={offer.status} />
        </div>
        <div className="absolute right-2 top-2 rounded-full bg-black/50 p-0.5 backdrop-blur">
          <ScoreRing score={offer.score} size={38} />
        </div>
        {offer.priorityPinned && (
          <div className="absolute bottom-2 right-2 rounded-full bg-brand p-1 text-brand-fg">
            <IconStar width={13} height={13} fill="currentColor" />
          </div>
        )}
      </Link>

      <div className="flex flex-1 flex-col p-3">
        <Link href={`/oferta/${offer.id}`} className="hover:text-brand">
          <h3 className="line-clamp-1 font-semibold">{offer.name}</h3>
        </Link>
        <p className="line-clamp-1 text-xs text-muted">
          {offer.product || PLATFORM_LABELS[offer.platform]}
        </p>

        {offer.hook && (
          <p className="mt-2 line-clamp-2 text-sm text-fg/80">“{offer.hook}”</p>
        )}

        <div className="mt-2 flex flex-wrap gap-1">
          <CreativeBadge type={offer.creativeType} />
          <LpBadge type={offer.landingPageType} />
        </div>

        {offer.tags.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1">
            {offer.tags.slice(0, 3).map((t) => (
              <span key={t} className="text-[11px] text-brand">
                #{t}
              </span>
            ))}
            {offer.tags.length > 3 && (
              <span className="text-[11px] text-muted">+{offer.tags.length - 3}</span>
            )}
          </div>
        )}

        <div className="mt-auto flex items-center justify-between pt-3">
          <span className="text-[11px] text-muted">{fmtRelative(offer.createdAt)}</span>
          <div className="flex gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
            <IconBtn title="Fixar" onClick={onTogglePin} active={offer.priorityPinned}>
              <IconStar width={15} height={15} />
            </IconBtn>
            <IconBtn title="Editar" onClick={onEdit}>
              <IconEdit width={15} height={15} />
            </IconBtn>
            <IconBtn title="Duplicar" onClick={onDuplicate}>
              <IconCopy width={15} height={15} />
            </IconBtn>
            <IconBtn title="Excluir" onClick={onDelete} danger>
              <IconTrash width={15} height={15} />
            </IconBtn>
          </div>
        </div>
      </div>
    </div>
  );
}

function IconBtn({
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
