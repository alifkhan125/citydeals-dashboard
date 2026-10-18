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
          OpenStreetMap preview: {lat.toFixed(6)}, {lon.toFixed(6)}
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
  const skipNextCoordinateSync = useRef(false);
  const [drag, setDrag] = useState<{
    pointerId: number;
    startX: number;
    startY: number;
    startTileX: number;
    startTileY: number;
    moved: boolean;
  } | null>(null);
  const minZoom = 2;
  const maxZoom = 19;
  const currentZoom = Math.min(maxZoom, Math.max(minZoom, zoom));

  useEffect(() => {
    if (skipNextCoordinateSync.current) {
      skipNextCoordinateSync.current = false;
      return;
    }
    // Keep the map centered when the form/search changes coordinates outside drag.
    setCenter({ latitude, longitude });
    if (hasCoordinates && !hadCoordinates.current) {
      setZoom((current) => Math.min(maxZoom, Math.max(current, 13)));
    }
    hadCoordinates.current = hasCoordinates;
  }, [hasCoordinates, latitude, longitude]);

  const centerX = lonToTileX(center.longitude, currentZoom);
  const centerY = latToTileY(center.latitude, currentZoom);
  const selectedX = lonToTileX(longitude, currentZoom);
  const selectedY = latToTileY(latitude, currentZoom);
  const markerOffsetX = (selectedX - centerX) * 256;
  const markerOffsetY = (selectedY - centerY) * 256;
  const tileCount = 5;
  const tileOffset = Math.floor(tileCount / 2);
  const maxTile = 2 ** currentZoom;
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
    skipNextCoordinateSync.current = true;
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
      latitude: clampLatitude(tileYToLat(nextTileY, currentZoom)),
      longitude: normalizeLongitude(tileXToLon(nextTileX, currentZoom)),
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
        latitude: clampLatitude(tileYToLat(nextTileY, currentZoom)),
        longitude: normalizeLongitude(tileXToLon(nextTileX, currentZoom)),
      });
    } else {
      const clickedX = event.clientX - rect.left;
      const clickedY = event.clientY - rect.top;
      const globalX = centerX * 256 + (clickedX - rect.width / 2);
      const globalY = centerY * 256 + (clickedY - rect.height / 2);
      pickCoordinates(tileYToLat(globalY / 256, currentZoom), tileXToLon(globalX / 256, currentZoom));
    }
    setDrag(null);
  }

  const fullMapUrl = useMemo(
    () =>
      `https://www.openstreetmap.org/?mlat=${encodeURIComponent(
        String(latitude),
      )}&mlon=${encodeURIComponent(String(longitude))}#map=${currentZoom}/${encodeURIComponent(
        String(latitude),
      )}/${encodeURIComponent(String(longitude))}`,
    [latitude, longitude, currentZoom],
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
              key={`${tile.rawX}-${tile.rawY}-${currentZoom}`}
              alt=""
              draggable={false}
              src={`https://tile.openstreetmap.org/${currentZoom}/${tile.x}/${tile.y}.png`}
              onError={(e) => {
                // If a tile fails to load, gracefully hide broken image icon
                e.currentTarget.style.opacity = "0";
              }}
              className="size-64 select-none bg-slate-200"
            />
          ))}
        </div>

        {hasCoordinates ? (
          <div
            className="pointer-events-none absolute left-1/2 top-1/2 z-10 transition-transform duration-100 ease-out"
            style={{
              transform: `translate(calc(-50% + ${markerOffsetX}px), calc(-100% + ${markerOffsetY}px))`,
            }}
          >
            {/* Ground anchor indicator precisely at coordinate */}
            <div className="absolute left-1/2 top-full flex -translate-x-1/2 -translate-y-1/2 items-center justify-center">
              <span className="absolute size-4 animate-ping rounded-full bg-[#ea580c]/30 opacity-75" />
              <span className="absolute h-1.5 w-3.5 rounded-full bg-slate-900/30 blur-[0.5px]" />
              <span className="size-2 rounded-full bg-[#ea580c] ring-2 ring-white shadow-sm" />
            </div>

            {/* Map Pin pointing directly down to the anchor */}
            <div className="relative flex flex-col items-center">
              <svg
                width="32"
                height="42"
                viewBox="0 0 32 42"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="drop-shadow-[0_4px_6px_rgba(0,0,0,0.35)]"
              >
                <defs>
                  <linearGradient id="mapPinGradient" x1="16" y1="1" x2="16" y2="42" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#fb923c" />
                    <stop offset="100%" stopColor="#ea580c" />
                  </linearGradient>
                </defs>
                <path
                  d="M16 42C16 42 2 25 2 15C2 7.27 8.27 1 16 1C23.73 1 30 7.27 30 15C30 25 16 42 16 42Z"
                  fill="url(#mapPinGradient)"
                  stroke="#FFFFFF"
                  strokeWidth="2"
                  strokeLinejoin="round"
                />
                <circle cx="16" cy="15" r="5" fill="#FFFFFF" />
                <circle cx="16" cy="15" r="2.5" fill="#ea580c" />
              </svg>
            </div>
          </div>
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
            disabled={currentZoom >= maxZoom}
            onClick={() => setZoom((current) => Math.min(maxZoom, current + 1))}
            className="grid size-9 place-items-center border-b border-slate-200 text-lg font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            +
          </button>
          <button
            type="button"
            aria-label="Zoom out"
            disabled={currentZoom <= minZoom}
            onClick={() => setZoom((current) => Math.max(minZoom, current - 1))}
            className="grid size-9 place-items-center text-xl font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            -
          </button>
        </div>

        <div className="absolute bottom-3 left-3 z-20 rounded-md bg-white/95 px-2 py-1 text-[11px] font-medium text-slate-600 shadow">
          Zoom {currentZoom}
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 px-3 py-2 text-xs">
        <span className="text-slate-500">
          {hasCoordinates
            ? `Selected: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
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
