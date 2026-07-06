"use client";

import type { Offer } from "@/lib/types";
import { OfferCard } from "../OfferCard";

export function GridView({
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
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {offers.map((o) => (
        <OfferCard
          key={o.id}
          offer={o}
          onEdit={() => onEdit(o)}
          onDuplicate={() => onDuplicate(o)}
          onDelete={() => onDelete(o)}
          onTogglePin={() => onTogglePin(o)}
        />
      ))}
    </div>
  );
}
