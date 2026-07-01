"use client";

import { useEffect, useMemo } from "react";
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

  return (
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
    </MapContainer>
  );
}

