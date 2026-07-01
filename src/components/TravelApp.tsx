"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Sidebar from "./Sidebar";
import PinForm from "./PinForm";
import PinDetail from "./PinDetail";
import ItineraryPanel from "./ItineraryPanel";
import {
  createPin,
  deletePin,
  fetchPins,
  updatePin,
} from "@/lib/api";
import type { Pin, PinInput } from "@/lib/types";

const MapView = dynamic(() => import("./MapView"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-gray-100 text-sm text-gray-500">
      Loading map…
    </div>
  ),
});

type PanelView = "places" | "itineraries";
type MobileView = "map" | "panel";

export default function TravelApp() {
  const [pins, setPins] = useState<Pin[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<{ lat: number; lng: number } | null>(null);
  const [editing, setEditing] = useState<Pin | null>(null);
  const [placing, setPlacing] = useState(false);
  const [view, setView] = useState<PanelView>("places");
  const [mobileView, setMobileView] = useState<MobileView>("map");

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      setPins(await fetchPins());
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Failed to load pins");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleAddAt = useCallback((lat: number, lng: number) => {
    setEditing(null);
    setSelectedId(null);
    setPlacing(false);
    setDraft({ lat, lng });
    setView("places");
    setMobileView("panel");
  }, []);

  const handleSelect = useCallback((id: string) => {
    setSelectedId(id);
    setDraft(null);
    setEditing(null);
    setPlacing(false);
    setView("places");
    setMobileView("panel");
  }, []);

  const handleDeselect = useCallback(() => {
    setSelectedId(null);
  }, []);

  const selectPinByName = useCallback(
    (name: string) => {
      const match = pins.find((p) => p.name === name);
      if (!match) return;
      setSelectedId(match.id);
      setDraft(null);
      setEditing(null);
      setPlacing(false);
      setMobileView("map"); // show the pin on the map
    },
    [pins],
  );

  const togglePlacing = useCallback(() => {
    setDraft(null);
    setEditing(null);
    setSelectedId(null);
    setPlacing((p) => {
      const next = !p;
      if (next) setMobileView("map");
      return next;
    });
  }, []);

  const handleSubmit = useCallback(
    async (input: PinInput) => {
      if (editing) {
        const updated = await updatePin(editing.id, input);
        setPins((prev) =>
          prev.map((p) => (p.id === updated.id ? updated : p)),
        );
        setEditing(null);
        setSelectedId(updated.id);
      } else {
        const created = await createPin(input);
        setPins((prev) => [created, ...prev]);
        setDraft(null);
        setSelectedId(created.id);
      }
    },
    [editing],
  );

  const handleDelete = useCallback(
    async (id: string) => {
      const prev = pins;
      setPins((p) => p.filter((x) => x.id !== id));
      if (selectedId === id) setSelectedId(null);
      if (editing?.id === id) setEditing(null);
      try {
        await deletePin(id);
      } catch {
        setPins(prev); // rollback on failure
      }
    },
    [pins, selectedId, editing],
  );

  const handleCancel = useCallback(() => {
    setDraft(null);
    setEditing(null);
  }, []);

  const showForm = draft !== null || editing !== null;
  const selectedPin = useMemo(
    () => pins.find((p) => p.id === selectedId) ?? null,
    [pins, selectedId],
  );
  const showDetail = !showForm && selectedPin !== null;
  const count = pins.length;

  return (
    <div className="relative flex h-[100dvh] w-full flex-col overflow-hidden md:flex-row">
      {/* Sidebar / panel */}
      <aside
        className={`${
          mobileView === "panel" ? "flex" : "hidden"
        } h-[100dvh] w-full flex-col bg-white md:flex md:h-auto md:w-[380px] md:shrink-0 md:border-r md:border-gray-200`}
      >
        <header className="bg-gradient-to-r from-slate-900 to-slate-700 text-white">
          <div className="flex items-center justify-between gap-3 p-4 pb-2">
            <div className="min-w-0">
              <h1 className="text-lg font-bold leading-tight">
                🗺️ İstanbul Travel Map
              </h1>
              <p className="mt-0.5 text-[11px] text-white/70">
                {count} {count === 1 ? "place" : "places"} · middle-click or{" "}
                <span className="font-medium text-white/90">+ Add</span> to pin
              </p>
            </div>
            <button
              type="button"
              onClick={togglePlacing}
              className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold shadow-sm transition ${
                placing
                  ? "bg-amber-400 text-slate-900 hover:bg-amber-300"
                  : "bg-white text-slate-900 hover:bg-white/90"
              }`}
            >
              {placing ? "Tap the map…" : "+ Add place"}
            </button>
          </div>
          <div className="flex gap-1 px-4 pb-3">
            {(
              [
                ["places", "📍 Places"],
                ["itineraries", "🗓️ Itineraries"],
              ] as [PanelView, string][]
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setView(key)}
                className={`flex-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  view === key
                    ? "bg-white text-slate-900"
                    : "bg-white/10 text-white/80 hover:bg-white/20"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </header>

        <div className="nice-scroll flex-1 overflow-y-auto p-4">
          {view === "itineraries" ? (
            <ItineraryPanel onSelectPinByName={selectPinByName} />
          ) : showForm ? (
            <PinForm
              draft={draft}
              editing={editing}
              onSubmit={handleSubmit}
              onCancel={handleCancel}
            />
          ) : showDetail && selectedPin ? (
            <PinDetail
              pin={selectedPin}
              onBack={handleDeselect}
              onEdit={setEditing}
              onDelete={handleDelete}
            />
          ) : loading ? (
            <p className="text-sm text-gray-500">Loading places…</p>
          ) : loadError ? (
            <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {loadError}
              <button
                onClick={load}
                className="mt-2 block text-xs font-medium underline"
              >
                Retry
              </button>
            </div>
          ) : (
            <Sidebar
              pins={pins}
              selectedId={selectedId}
              onSelect={handleSelect}
              onEdit={setEditing}
              onDelete={handleDelete}
            />
          )}
        </div>
      </aside>

      {/* Map */}
      <main
        className={`${
          mobileView === "map" ? "block" : "hidden"
        } relative h-[100dvh] w-full md:block md:h-auto md:flex-1`}
      >
        <MapView
          pins={pins}
          selectedId={selectedId}
          draft={draft}
          placing={placing}
          onAddAt={handleAddAt}
          onSelect={handleSelect}
          onDeselect={handleDeselect}
        />
      </main>

      {/* Mobile Map / List switch */}
      <div className="fixed bottom-4 left-1/2 z-[1200] flex -translate-x-1/2 gap-1 rounded-full bg-slate-900/90 p-1 shadow-lg backdrop-blur md:hidden">
        <button
          type="button"
          onClick={() => setMobileView("map")}
          className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
            mobileView === "map" ? "bg-white text-slate-900" : "text-white/80"
          }`}
        >
          🗺️ Map
        </button>
        <button
          type="button"
          onClick={() => setMobileView("panel")}
          className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
            mobileView === "panel" ? "bg-white text-slate-900" : "text-white/80"
          }`}
        >
          📋 List
        </button>
      </div>
    </div>
  );
}


