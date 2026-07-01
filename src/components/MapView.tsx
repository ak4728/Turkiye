"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Tooltip,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Pin } from "@/lib/types";
import { getCategory } from "@/lib/categories";

interface MapViewProps {
  pins: Pin[];
  selectedId: string | null;
  draft: { lat: number; lng: number } | null;
  placing: boolean;
  onAddAt: (lat: number, lng: number) => void;
  onSelect: (id: string) => void;
  onDeselect: () => void;
}

const DEFAULT_CENTER: [number, number] = [41.035, 28.995]; // Istanbul, both shores
const DEFAULT_ZOOM = 12;

function markerIcon(emoji: string, color: string, active: boolean) {
  return L.divIcon({
    className: "travel-pin",
    html: `<div class="travel-pin__bubble${
      active ? " travel-pin__bubble--active" : ""
    }" style="--pin-color:${color}"><span>${emoji}</span></div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -34],
    tooltipAnchor: [0, -30],
  });
}

const draftIcon = L.divIcon({
  className: "travel-pin",
  html: `<div class="travel-pin__bubble travel-pin__bubble--draft" style="--pin-color:#0f172a"><span>➕</span></div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 36],
});

const userIcon = L.divIcon({
  className: "travel-user",
  html: `<div class="travel-user__dot"></div>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

function Recenter({ pos }: { pos: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (pos) map.flyTo(pos, Math.max(map.getZoom(), 14), { duration: 0.8 });
  }, [pos, map]);
  return null;
}

// Keep Leaflet's canvas in sync whenever the map container is resized or shown
// (e.g. the mobile split view / map-list toggle) — otherwise tiles render grey.
function AutoResize() {
  const map = useMap();
  useEffect(() => {
    const el = map.getContainer();
    const ro = new ResizeObserver(() => map.invalidateSize());
    ro.observe(el);
    return () => ro.disconnect();
  }, [map]);
  return null;
}

function MapInteractions({
  placing,
  onAddAt,
  onDeselect,
}: {
  placing: boolean;
  onAddAt: (lat: number, lng: number) => void;
  onDeselect: () => void;
}) {
  useMapEvents({
    // Middle mouse button drops a pin anywhere on the map.
    mousedown(e) {
      if (e.originalEvent.button === 1) {
        e.originalEvent.preventDefault();
        onAddAt(e.latlng.lat, e.latlng.lng);
      }
    },
    // Left click: place a pin while in "add" mode, otherwise clear selection.
    click(e) {
      if (placing) {
        onAddAt(e.latlng.lat, e.latlng.lng);
      } else {
        onDeselect();
      }
    },
  });
  return null;
}

function FlyTo({ pin }: { pin: Pin | null }) {
  const map = useMap();
  useEffect(() => {
    if (pin) {
      map.flyTo([pin.latitude, pin.longitude], Math.max(map.getZoom(), 14), {
        duration: 0.8,
      });
    }
  }, [pin, map]);
  return null;
}

export default function MapView({
  pins,
  selectedId,
  draft,
  placing,
  onAddAt,
  onSelect,
  onDeselect,
}: MapViewProps) {
  const selectedPin = useMemo(
    () => pins.find((p) => p.id === selectedId) ?? null,
    [pins, selectedId],
  );
  const [userPos, setUserPos] = useState<[number, number] | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);

  const locate = useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setGeoError("Geolocation isn't supported on this device.");
      return;
    }
    setGeoError(null);
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setUserPos([p.coords.latitude, p.coords.longitude]);
        setLocating(false);
      },
      (err) => {
        setLocating(false);
        setGeoError(
          err.code === err.PERMISSION_DENIED
            ? "Location blocked — needs HTTPS or permission."
            : "Couldn't get your location.",
        );
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }, []);

  return (
    <div className="relative h-full w-full">
      <MapContainer
      center={DEFAULT_CENTER}
      zoom={DEFAULT_ZOOM}
      scrollWheelZoom
      zoomControl={false}
      className={`h-full w-full${placing ? " is-placing" : ""}`}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        subdomains="abcd"
      />
      <MapInteractions
        placing={placing}
        onAddAt={onAddAt}
        onDeselect={onDeselect}
      />
      <FlyTo pin={selectedPin} />
      <AutoResize />

      {pins.map((pin) => {
        const cat = getCategory(pin.category);
        return (
          <Marker
            key={pin.id}
            position={[pin.latitude, pin.longitude]}
            icon={markerIcon(cat.icon, cat.color, pin.id === selectedId)}
            eventHandlers={{ click: () => onSelect(pin.id) }}
          >
            <Tooltip
              direction="top"
              offset={[0, -6]}
              opacity={1}
              className="travel-tip"
            >
              <span className="tip-name">{pin.name}</span>
              <br />
              <span className="tip-meta">
                {cat.icon} {cat.label}
                {pin.rating ? ` · ${"★".repeat(pin.rating)}` : ""}
              </span>
            </Tooltip>
          </Marker>
        );
      })}

      {draft ? (
        <Marker position={[draft.lat, draft.lng]} icon={draftIcon}>
          <Tooltip direction="top" offset={[0, -6]} className="travel-tip">
            New place
          </Tooltip>
        </Marker>
      ) : null}

      {userPos ? (
        <>
          <Recenter pos={userPos} />
          <Marker position={userPos} icon={userIcon}>
            <Tooltip direction="top" offset={[0, -6]} className="travel-tip">
              You are here
            </Tooltip>
          </Marker>
        </>
      ) : null}
      </MapContainer>

      <button
        type="button"
        onClick={locate}
        title="Find my location"
        aria-label="Find my location"
        className="absolute right-3 top-3 z-[1000] flex h-10 w-10 items-center justify-center rounded-full bg-white text-lg shadow-md ring-1 ring-black/5 transition hover:bg-gray-50"
      >
        {locating ? "…" : "📍"}
      </button>

      {geoError ? (
        <div className="absolute right-3 top-16 z-[1000] max-w-[220px] rounded-lg bg-slate-900/90 px-3 py-2 text-xs text-white shadow-lg">
          {geoError}
        </div>
      ) : null}
    </div>
  );
}

