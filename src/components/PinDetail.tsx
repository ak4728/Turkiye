"use client";

import { useEffect, useState } from "react";
import { getCategory } from "@/lib/categories";
import type { Pin } from "@/lib/types";

interface PinDetailProps {
  pin: Pin;
  onBack: () => void;
  onEdit: (pin: Pin) => void;
  onDelete: (id: string) => void;
}

function Stars({ rating }: { rating: number }) {
  return (
    <span className="text-amber-500" title={`${rating} / 5`}>
      {"★".repeat(rating)}
      <span className="text-gray-300">{"★".repeat(5 - rating)}</span>
    </span>
  );
}

export default function PinDetail({
  pin,
  onBack,
  onEdit,
  onDelete,
}: PinDetailProps) {
  const cat = getCategory(pin.category);
  const gallery = pin.images?.length
    ? pin.images
    : pin.imageUrl
      ? [pin.imageUrl]
      : [];
  const [active, setActive] = useState(0);
  const [failed, setFailed] = useState<Record<number, boolean>>({});

  // Reset the gallery when a different pin is opened.
  useEffect(() => {
    setActive(0);
    setFailed({});
  }, [pin.id]);

  const showImage = gallery.length > 0 && !failed[active];
  const directions = `https://www.google.com/maps/search/?api=1&query=${pin.latitude},${pin.longitude}`;

  return (
    <div className="flex flex-col gap-4">
      {/* Hero */}
      <div className="relative h-44 w-full overflow-hidden rounded-2xl shadow-sm">
        {showImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={gallery[active]}
            alt={pin.name}
            className="h-full w-full object-cover"
            onError={() => setFailed((f) => ({ ...f, [active]: true }))}
          />
        ) : (
          <div
            className="flex h-full w-full items-center justify-center"
            style={{
              background: `linear-gradient(135deg, ${cat.color}, #0f172a)`,
            }}
          >
            <span className="text-6xl drop-shadow-lg">{cat.icon}</span>
          </div>
        )}

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

        <button
          type="button"
          onClick={onBack}
          className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-gray-800 shadow-sm backdrop-blur transition hover:bg-white"
        >
          ← Back
        </button>

        <div className="absolute inset-x-0 bottom-0 p-4">
          <span
            className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold text-white shadow-sm"
            style={{ backgroundColor: cat.color }}
          >
            {cat.icon} {cat.label}
          </span>
          <h2 className="mt-1.5 text-xl font-bold leading-tight text-white drop-shadow">
            {pin.name}
          </h2>
        </div>
      </div>

      {/* Thumbnail strip */}
      {gallery.length > 1 ? (
        <div className="nice-scroll -mt-1 flex gap-2 overflow-x-auto pb-1">
          {gallery.map((src, i) =>
            failed[i] ? null : (
              <button
                key={src + i}
                type="button"
                onClick={() => setActive(i)}
                className={`h-14 w-20 shrink-0 overflow-hidden rounded-lg border-2 transition ${
                  i === active
                    ? "border-gray-900"
                    : "border-transparent opacity-70 hover:opacity-100"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={src}
                  alt=""
                  className="h-full w-full object-cover"
                  onError={() => setFailed((f) => ({ ...f, [i]: true }))}
                />
              </button>
            ),
          )}
        </div>
      ) : null}

      {/* Meta */}
      <div className="flex flex-col gap-3 text-sm">
        {pin.rating ? (
          <div className="text-base">
            <Stars rating={pin.rating} />
          </div>
        ) : null}

        {pin.address ? (
          <p className="flex items-start gap-2 text-gray-600">
            <span>📍</span>
            <span>{pin.address}</span>
          </p>
        ) : null}

        {pin.description ? (
          <p className="leading-relaxed text-gray-800">{pin.description}</p>
        ) : null}

        {pin.notes ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-[13px] leading-relaxed text-amber-900">
            <span className="mr-1 font-semibold">Notes:</span>
            {pin.notes}
          </div>
        ) : null}

        {pin.tags.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {pin.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] text-gray-600"
              >
                #{tag}
              </span>
            ))}
          </div>
        ) : null}

        <a
          href={directions}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-1 inline-flex w-fit items-center gap-1.5 text-sm font-medium text-blue-600 hover:underline"
        >
          🧭 Get directions
        </a>
      </div>

      {/* Actions */}
      <div className="flex gap-2 border-t border-gray-100 pt-3">
        <button
          type="button"
          onClick={() => onEdit(pin)}
          className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium transition hover:bg-gray-100"
        >
          ✏️ Edit
        </button>
        <button
          type="button"
          onClick={() => onDelete(pin.id)}
          className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50"
        >
          🗑️ Delete
        </button>
      </div>
    </div>
  );
}
