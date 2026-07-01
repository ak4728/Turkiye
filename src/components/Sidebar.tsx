"use client";

import { useMemo, useState } from "react";
import { CATEGORIES, getCategory, type Category } from "@/lib/categories";
import type { Pin } from "@/lib/types";

interface SidebarProps {
  pins: Pin[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onEdit: (pin: Pin) => void;
  onDelete: (id: string) => void;
}

function Thumb({ pin, cat }: { pin: Pin; cat: Category }) {
  const [failed, setFailed] = useState(false);
  const src = pin.images?.[0] ?? pin.imageUrl;
  if (src && !failed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt=""
        className="h-11 w-11 shrink-0 rounded-lg object-cover"
        onError={() => setFailed(true)}
      />
    );
  }
  return (
    <div
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-lg text-white"
      style={{ background: `linear-gradient(135deg, ${cat.color}, #0f172a)` }}
    >
      {cat.icon}
    </div>
  );
}

export default function Sidebar({
  pins,
  selectedId,
  onSelect,
  onEdit,
  onDelete,
}: SidebarProps) {
  const grouped = useMemo(() => {
    const map = new Map<string, Pin[]>();
    for (const pin of pins) {
      const key = getCategory(pin.category).id;
      const list = map.get(key) ?? [];
      list.push(pin);
      map.set(key, list);
    }
    return map;
  }, [pins]);

  if (pins.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 bg-white p-6 text-center text-sm text-gray-500">
        No places yet. Middle-click the map (or use{" "}
        <span className="font-medium">+ Add place</span>) to drop your first pin.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {CATEGORIES.map((cat) => {
        const items = grouped.get(cat.id);
        if (!items || items.length === 0) return null;
        return (
          <section key={cat.id}>
            <h3
              className="mb-2 flex items-center gap-2 text-[13px] font-semibold uppercase tracking-wide"
              style={{ color: cat.color }}
            >
              <span>{cat.icon}</span>
              {cat.label}
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-normal text-gray-600">
                {items.length}
              </span>
            </h3>
            <ul className="flex flex-col gap-1.5">
              {items.map((pin) => {
                const active = pin.id === selectedId;
                return (
                  <li key={pin.id}>
                    <div
                      className={`group flex items-center gap-3 rounded-xl border bg-white px-2.5 py-2 transition ${
                        active
                          ? "border-gray-900 shadow-sm"
                          : "border-gray-100 hover:border-gray-300 hover:shadow-sm"
                      }`}
                    >
                      <Thumb pin={pin} cat={cat} />
                      <button
                        type="button"
                        onClick={() => onSelect(pin.id)}
                        className="min-w-0 flex-1 text-left"
                      >
                        <div className="truncate text-sm font-medium">
                          {pin.name}
                        </div>
                        {pin.rating ? (
                          <div className="text-xs text-amber-500">
                            {"★".repeat(pin.rating)}
                          </div>
                        ) : null}
                        {pin.address ? (
                          <div className="truncate text-xs text-gray-500">
                            {pin.address}
                          </div>
                        ) : null}
                      </button>
                      <div className="flex shrink-0 flex-col gap-1 opacity-0 transition group-hover:opacity-100">
                        <button
                          type="button"
                          onClick={() => onEdit(pin)}
                          title="Edit"
                          className="text-xs text-gray-400 hover:text-gray-900"
                        >
                          ✏️
                        </button>
                        <button
                          type="button"
                          onClick={() => onDelete(pin.id)}
                          title="Delete"
                          className="text-xs text-gray-400 hover:text-red-600"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </div>
  );
}

