"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Sidebar from "./Sidebar";
import PinForm from "./PinForm";
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

export default function TravelApp() {
  const [pins, setPins] = useState<Pin[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<{ lat: number; lng: number } | null>(null);
  const [editing, setEditing] = useState<Pin | null>(null);

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

  const handleMapClick = useCallback((lat: number, lng: number) => {
    setEditing(null);
    setSelectedId(null);
    setDraft({ lat, lng });
  }, []);

  const handleSelect = useCallback((id: string) => {
    setSelectedId(id);
    setDraft(null);
    setEditing(null);
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

  const counts = useMemo(() => pins.length, [pins]);

  return (
    <div className="flex h-screen w-screen overflow-hidden">
      {/* Sidebar */}
      <aside className="flex w-[380px] shrink-0 flex-col border-r border-gray-200 bg-white">
        <header className="border-b border-gray-200 p-4">
          <h1 className="text-xl font-bold">🗺️ Türkiye Travel Map</h1>
          <p className="mt-1 text-xs text-gray-500">
            {counts} saved {counts === 1 ? "place" : "places"} · click the map to
            add a pin
          </p>
        </header>

        <div className="flex-1 overflow-y-auto p-4">
          {showForm ? (
            <PinForm
              draft={draft}
              editing={editing}
              onSubmit={handleSubmit}
              onCancel={handleCancel}
            />
          ) : loading ? (
            <p className="text-sm text-gray-500">Loading pins…</p>
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
      <main className="relative flex-1">
        <MapView
          pins={pins}
          selectedId={selectedId}
          draft={draft}
          onMapClick={handleMapClick}
          onSelect={handleSelect}
        />
      </main>
    </div>
  );
}
