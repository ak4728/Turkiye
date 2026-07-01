"use client";

import { useState } from "react";
import {
  ITINERARIES,
  ITINERARY_LEVELS,
  type Itinerary,
} from "@/lib/itineraries";

interface ItineraryPanelProps {
  /** Called with a Pin.name when a linked stop is tapped. */
  onSelectPinByName: (name: string) => void;
}

export default function ItineraryPanel({
  onSelectPinByName,
}: ItineraryPanelProps) {
  const [openId, setOpenId] = useState<string | null>(null);
  const open = ITINERARIES.find((i) => i.id === openId) ?? null;

  if (open) {
    return <ItineraryDetail itinerary={open} onBack={() => setOpenId(null)} onSelectPinByName={onSelectPinByName} />;
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-gray-500">
        Three ready-made 5-day plans. Tap a stop to jump to it on the map.
      </p>
      {ITINERARIES.map((it) => {
        const lvl = ITINERARY_LEVELS[it.level];
        return (
          <button
            key={it.id}
            type="button"
            onClick={() => setOpenId(it.id)}
            className="flex flex-col gap-1 rounded-2xl border border-gray-100 bg-white p-4 text-left shadow-sm transition hover:border-gray-300 hover:shadow"
          >
            <div className="flex items-center gap-2">
              <span className="text-2xl">{it.emoji}</span>
              <span className="text-base font-semibold">{it.name}</span>
              <span
                className="ml-auto rounded-full px-2 py-0.5 text-[11px] font-semibold text-white"
                style={{ backgroundColor: lvl.color }}
              >
                {lvl.label}
              </span>
            </div>
            <p className="text-xs text-gray-600">{it.tagline}</p>
            <p className="text-[11px] text-gray-400">{it.days.length} days · {lvl.blurb}</p>
          </button>
        );
      })}
    </div>
  );
}

function ItineraryDetail({
  itinerary,
  onBack,
  onSelectPinByName,
}: {
  itinerary: Itinerary;
  onBack: () => void;
  onSelectPinByName: (name: string) => void;
}) {
  const lvl = ITINERARY_LEVELS[itinerary.level];
  return (
    <div className="flex flex-col gap-4">
      <button
        type="button"
        onClick={onBack}
        className="w-fit text-xs font-medium text-gray-500 hover:text-gray-900"
      >
        ← All itineraries
      </button>

      <div>
        <div className="flex items-center gap-2">
          <span className="text-2xl">{itinerary.emoji}</span>
          <h2 className="text-lg font-bold">{itinerary.name}</h2>
          <span
            className="ml-auto rounded-full px-2 py-0.5 text-[11px] font-semibold text-white"
            style={{ backgroundColor: lvl.color }}
          >
            {lvl.label}
          </span>
        </div>
        <p className="mt-1 text-xs text-gray-600">{itinerary.tagline}</p>
      </div>

      <ol className="flex flex-col gap-4">
        {itinerary.days.map((d) => (
          <li key={d.day} className="rounded-2xl border border-gray-100 bg-white p-3 shadow-sm">
            <div className="mb-2 flex items-baseline gap-2">
              <span
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                style={{ backgroundColor: lvl.color }}
              >
                {d.day}
              </span>
              <div>
                <div className="text-sm font-semibold leading-tight">{d.title}</div>
                <div className="text-[11px] uppercase tracking-wide text-gray-400">
                  {d.area}
                </div>
              </div>
            </div>
            <ul className="flex flex-col gap-1.5 pl-1">
              {d.stops.map((s, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gray-300" />
                  <span className="min-w-0">
                    {s.pin ? (
                      <button
                        type="button"
                        onClick={() => onSelectPinByName(s.pin as string)}
                        className="font-medium text-blue-600 hover:underline"
                      >
                        {s.name}
                      </button>
                    ) : (
                      <span className="font-medium text-gray-800">{s.name}</span>
                    )}
                    {s.note ? (
                      <span className="text-gray-500"> — {s.note}</span>
                    ) : null}
                  </span>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ol>
    </div>
  );
}
