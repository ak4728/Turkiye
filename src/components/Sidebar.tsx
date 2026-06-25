"use client";

import { useMemo } from "react";
import { CATEGORIES, getCategory } from "@/lib/categories";
import type { Pin } from "@/lib/types";

interface SidebarProps {
  pins: Pin[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onEdit: (pin: Pin) => void;
  onDelete: (id: string) => void;
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
      <div className="rounded-lg border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500">
        No pins yet. Click anywhere on the map to add your first location.
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
              className="mb-2 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide"
              style={{ color: cat.color }}
            >
              <span>{cat.icon}</span>
              {cat.label}
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                {items.length}
              </span>
            </h3>
            <ul className="flex flex-col gap-1">
              {items.map((pin) => (
                <li key={pin.id}>
                  <div
                    className={`group flex items-start justify-between gap-2 rounded-md border px-3 py-2 transition ${
                      pin.id === selectedId
                        ? "border-gray-900 bg-gray-50"
                        : "border-transparent hover:border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => onSelect(pin.id)}
                      className="flex-1 text-left"
                    >
                      <div className="text-sm font-medium">{pin.name}</div>
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
                      {pin.tags.length > 0 ? (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {pin.tags.map((tag) => (
                            <span
                              key={tag}
                              className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-600"
                            >
                              {tag}
                            </span>
                          ))}
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
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
