"use client";

import { useEffect, useMemo } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
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
  onMapClick: (lat: number, lng: number) => void;
  onSelect: (id: string) => void;
}

const DEFAULT_CENTER: [number, number] = [38.9637, 35.2433]; // Türkiye
const DEFAULT_ZOOM = 6;

function markerIcon(emoji: string, color: string, active: boolean) {
  return L.divIcon({
    className: "travel-pin",
    html: `<div class="travel-pin__bubble" style="--pin-color:${color};${
      active ? "transform:scale(1.2);z-index:1000;" : ""
    }"><span>${emoji}</span></div>`,
    iconSize: [34, 34],
    iconAnchor: [17, 34],
    popupAnchor: [0, -32],
  });
}

const draftIcon = L.divIcon({
  className: "travel-pin",
  html: `<div class="travel-pin__bubble travel-pin__bubble--draft" style="--pin-color:#111827"><span>➕</span></div>`,
  iconSize: [34, 34],
  iconAnchor: [17, 34],
});

function ClickHandler({
  onMapClick,
}: {
  onMapClick: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function FlyTo({ pin }: { pin: Pin | null }) {
  const map = useMap();
  useEffect(() => {
    if (pin) {
      map.flyTo([pin.latitude, pin.longitude], Math.max(map.getZoom(), 13), {
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
  onMapClick,
  onSelect,
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
      className="h-full w-full"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <ClickHandler onMapClick={onMapClick} />
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
            <Popup>
              <strong>{pin.name}</strong>
              <br />
              <span style={{ color: cat.color }}>
                {cat.icon} {cat.label}
              </span>
              {pin.address ? (
                <>
                  <br />
                  <small>{pin.address}</small>
                </>
              ) : null}
            </Popup>
          </Marker>
        );
      })}

      {draft ? (
        <Marker position={[draft.lat, draft.lng]} icon={draftIcon}>
          <Popup>New pin location</Popup>
        </Marker>
      ) : null}
    </MapContainer>
  );
}
