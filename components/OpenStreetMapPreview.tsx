"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent,
  type ReactNode,
} from "react";

interface OpenStreetMapPreviewProps {
  latitude: string | number | null | undefined;
  longitude: string | number | null | undefined;
  label?: string;
  onPick?: (coords: { latitude: number; longitude: number }) => void;
  searchSlot?: ReactNode;
}

function toNumber(value: OpenStreetMapPreviewProps["latitude"]) {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

export default function OpenStreetMapPreview({
  latitude,
  longitude,
  label = "Selected location",
  onPick,
  searchSlot,
}: OpenStreetMapPreviewProps) {
  const parsedLat = toNumber(latitude);
  const parsedLon = toNumber(longitude);
  const lat = parsedLat ?? 20;
  const lon = parsedLon ?? 0;
  const hasCoordinates = parsedLat !== null && parsedLon !== null;

  if (!hasCoordinates && !onPick) {
    return (
      <div className="flex h-44 items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 text-center text-xs text-slate-500">
        Enter latitude and longitude to preview the map.
      </div>
    );
  }

  if (onPick) {
    return (
      <OpenStreetMapPicker
        latitude={lat}
        longitude={lon}
        hasCoordinates={hasCoordinates}
        label={label}
        onPick={onPick}
        searchSlot={searchSlot}
      />
    );
  }

  const delta = 0.01;
  const bbox = [
    lon - delta,
    lat - delta,
    lon + delta,
    lat + delta,
  ].join(",");
  const marker = `${lat},${lon}`;
  const embedUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(
    bbox,
  )}&layer=mapnik&marker=${encodeURIComponent(marker)}`;
  const fullMapUrl = `https://www.openstreetmap.org/?mlat=${encodeURIComponent(
    String(lat),
  )}&mlon=${encodeURIComponent(String(lon))}#map=16/${encodeURIComponent(
    String(lat),
  )}/${encodeURIComponent(String(lon))}`;

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <iframe
        title={`${label} map preview`}
        src={embedUrl}
        className="h-52 w-full border-0"
        loading="lazy"
      />
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 px-3 py-2 text-xs">
        <span className="text-slate-500">
          OpenStreetMap preview: {lat.toFixed(5)}, {lon.toFixed(5)}
        </span>
        <a
          className="font-medium text-[#f97316] hover:underline"
          href={fullMapUrl}
          rel="noreferrer"
          target="_blank"
        >
          Open larger map
        </a>
      </div>
    </div>
  );
}

function lonToTileX(lon: number, zoom: number) {
  return ((lon + 180) / 360) * 2 ** zoom;
}

function latToTileY(lat: number, zoom: number) {
  const rad = (lat * Math.PI) / 180;
  return (
    ((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2) *
    2 ** zoom
  );
}

function tileXToLon(x: number, zoom: number) {
  return (x / 2 ** zoom) * 360 - 180;
}

function tileYToLat(y: number, zoom: number) {
  const n = Math.PI - (2 * Math.PI * y) / 2 ** zoom;
  return (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
}

function clampLatitude(value: number) {
  return Math.max(-85.05112878, Math.min(85.05112878, value));
}

function normalizeLongitude(value: number) {
  if (value < -180 || value > 180) {
    return ((((value + 180) % 360) + 360) % 360) - 180;
  }
  return value;
}

function OpenStreetMapPicker({
  latitude,
  longitude,
  hasCoordinates,
  label,
  onPick,
  searchSlot,
}: {
  latitude: number;
  longitude: number;
  hasCoordinates: boolean;
  label: string;
  onPick: (coords: { latitude: number; longitude: number }) => void;
  searchSlot?: ReactNode;
}) {
  const [zoom, setZoom] = useState(hasCoordinates ? 13 : 2);
  const [center, setCenter] = useState({ latitude, longitude });
  const hadCoordinates = useRef(hasCoordinates);
  const [drag, setDrag] = useState<{
    pointerId: number;
    startX: number;
    startY: number;
    startTileX: number;
    startTileY: number;
    moved: boolean;
  } | null>(null);
  const minZoom = 2;
  const maxZoom = 20;

  useEffect(() => {
    if (drag) return;
    // Keep the map centered when the form/search changes coordinates outside drag.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCenter({ latitude, longitude });
    if (hasCoordinates && !hadCoordinates.current) {
      setZoom((current) => Math.max(current, 13));
    }
    hadCoordinates.current = hasCoordinates;
  }, [drag, hasCoordinates, latitude, longitude]);

  const centerX = lonToTileX(center.longitude, zoom);
  const centerY = latToTileY(center.latitude, zoom);
  const selectedX = lonToTileX(longitude, zoom);
  const selectedY = latToTileY(latitude, zoom);
  const markerOffsetX = (selectedX - centerX) * 256;
  const markerOffsetY = (selectedY - centerY) * 256;
  const tileCount = 5;
  const tileOffset = Math.floor(tileCount / 2);
  const maxTile = 2 ** zoom;
  const baseX = Math.floor(centerX) - tileOffset;
  const baseY = Math.floor(centerY) - tileOffset;
  const offsetX = (centerX - baseX) * 256;
  const offsetY = (centerY - baseY) * 256;
  const tiles = Array.from({ length: tileCount * tileCount }, (_, index) => {
    const rawX = baseX + (index % tileCount);
    const rawY = baseY + Math.floor(index / tileCount);
    const x = ((rawX % maxTile) + maxTile) % maxTile;
    const y = Math.max(0, Math.min(maxTile - 1, rawY));
    return { x, y, rawX, rawY };
  });

  function createPickedCoordinates(nextLatitude: number, nextLongitude: number) {
    return {
      latitude: Number(clampLatitude(nextLatitude).toFixed(6)),
      longitude: Number(normalizeLongitude(nextLongitude).toFixed(6)),
    };
  }

  function pickCoordinates(nextLatitude: number, nextLongitude: number) {
    const coords = createPickedCoordinates(nextLatitude, nextLongitude);
    onPick(coords);
  }

  function handleMapPointerDown(event: PointerEvent<HTMLButtonElement>) {
    event.currentTarget.setPointerCapture(event.pointerId);
    setDrag({
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startTileX: centerX,
      startTileY: centerY,
      moved: false,
    });
  }

  function handleMapPointerMove(event: PointerEvent<HTMLButtonElement>) {
    if (!drag || drag.pointerId !== event.pointerId) return;
    const deltaX = event.clientX - drag.startX;
    const deltaY = event.clientY - drag.startY;
    const nextTileX = drag.startTileX - deltaX / 256;
    const nextTileY = drag.startTileY - deltaY / 256;
    const nextCenter = {
      latitude: clampLatitude(tileYToLat(nextTileY, zoom)),
      longitude: normalizeLongitude(tileXToLon(nextTileX, zoom)),
    };

    setCenter(nextCenter);
    const moved = drag.moved || Math.hypot(deltaX, deltaY) > 4;
    if (!drag.moved && moved) {
      setDrag({ ...drag, moved: true });
    }
  }

  function handleMapPointerUp(event: PointerEvent<HTMLButtonElement>) {
    if (!drag || drag.pointerId !== event.pointerId) return;
    const rect = event.currentTarget.getBoundingClientRect();
    event.currentTarget.releasePointerCapture(event.pointerId);

    if (drag.moved) {
      const deltaX = event.clientX - drag.startX;
      const deltaY = event.clientY - drag.startY;
      const nextTileX = drag.startTileX - deltaX / 256;
      const nextTileY = drag.startTileY - deltaY / 256;
      setCenter({
        latitude: clampLatitude(tileYToLat(nextTileY, zoom)),
        longitude: normalizeLongitude(tileXToLon(nextTileX, zoom)),
      });
    } else {
      const clickedX = event.clientX - rect.left;
      const clickedY = event.clientY - rect.top;
      const globalX = centerX * 256 + (clickedX - rect.width / 2);
      const globalY = centerY * 256 + (clickedY - rect.height / 2);
      pickCoordinates(tileYToLat(globalY / 256, zoom), tileXToLon(globalX / 256, zoom));
    }
    setDrag(null);
  }

  const fullMapUrl = useMemo(
    () =>
      `https://www.openstreetmap.org/?mlat=${encodeURIComponent(
        String(latitude),
      )}&mlon=${encodeURIComponent(String(longitude))}#map=${zoom}/${encodeURIComponent(
        String(latitude),
      )}/${encodeURIComponent(String(longitude))}`,
    [latitude, longitude, zoom],
  );

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="relative h-[360px] w-full overflow-hidden bg-slate-100">
        <button
          type="button"
          aria-label={`Pick ${label} coordinates from map`}
          onPointerDown={handleMapPointerDown}
          onPointerMove={handleMapPointerMove}
          onPointerUp={handleMapPointerUp}
          onPointerCancel={() => setDrag(null)}
          className={`relative block size-full touch-none overflow-hidden text-left ${
            drag?.moved ? "cursor-grabbing" : "cursor-grab"
          }`}
        >
        <div
          className="absolute grid grid-cols-5 will-change-transform"
          style={{
            left: `calc(50% - ${offsetX}px)`,
            top: `calc(50% - ${offsetY}px)`,
            width: tileCount * 256,
            height: tileCount * 256,
          }}
        >
          {tiles.map((tile) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={`${tile.rawX}-${tile.rawY}-${zoom}`}
              alt=""
              draggable={false}
              src={`https://tile.openstreetmap.org/${zoom}/${tile.x}/${tile.y}.png`}
              className="size-64 select-none bg-slate-200"
            />
          ))}
        </div>

        {hasCoordinates ? (
          <span
            className="absolute left-1/2 top-1/2 z-10 flex -translate-x-1/2 -translate-y-full flex-col items-center transition-transform duration-100 ease-out"
            style={{
              transform: `translate(calc(-50% + ${markerOffsetX}px), calc(-100% + ${markerOffsetY}px))`,
            }}
          >
            <span className="grid size-8 place-items-center rounded-full bg-[#f97316] text-sm font-bold text-white shadow-lg">
              •
            </span>
            <span className="h-4 w-0.5 bg-[#f97316]" />
          </span>
        ) : (
          <span className="absolute inset-x-4 top-4 z-10 rounded-lg bg-white/95 px-3 py-2 text-center text-xs font-medium text-slate-600 shadow">
            Search, click, or drag the map to pick coordinates.
          </span>
        )}
        </button>

        {searchSlot && (
          <div className="absolute left-3 right-14 top-3 z-30">
            {searchSlot}
          </div>
        )}

        <div className="absolute right-3 top-3 z-20 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg">
          <button
            type="button"
            aria-label="Zoom in"
            disabled={zoom >= maxZoom}
            onClick={() => setZoom((current) => Math.min(maxZoom, current + 1))}
            className="grid size-9 place-items-center border-b border-slate-200 text-lg font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            +
          </button>
          <button
            type="button"
            aria-label="Zoom out"
            disabled={zoom <= minZoom}
            onClick={() => setZoom((current) => Math.max(minZoom, current - 1))}
            className="grid size-9 place-items-center text-xl font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            -
          </button>
        </div>

        <div className="absolute bottom-3 left-3 z-20 rounded-md bg-white/95 px-2 py-1 text-[11px] font-medium text-slate-600 shadow">
          Zoom {zoom}
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 px-3 py-2 text-xs">
        <span className="text-slate-500">
          {hasCoordinates
            ? `Selected: ${latitude.toFixed(5)}, ${longitude.toFixed(5)}`
            : "No coordinates selected yet"}
        </span>
        <a
          className="font-medium text-[#f97316] hover:underline"
          href={fullMapUrl}
          rel="noreferrer"
          target="_blank"
        >
          Open larger map
        </a>
      </div>
    </div>
  );
}
