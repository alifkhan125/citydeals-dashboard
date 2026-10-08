"use client";

import { useMemo, useState } from "react";
import { useGeofences, useUpdateGeofence } from "@/hooks/useGeofences";
import type { GeofenceItem } from "@/api/geofences";

function formatCoordinate(value: GeofenceItem["latitude"]) {
  if (value == null || value === "") return "Not set";
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue.toFixed(6) : String(value);
}

function formatRadius(value: number) {
  if (value >= 1000) return `${(value / 1000).toFixed(value % 1000 === 0 ? 0 : 1)} km`;
  return `${value} m`;
}

export default function GeofencesPage() {
  const { data = [], isLoading, isError } = useGeofences();
  const updateGeofence = useUpdateGeofence();
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [radiusMeters, setRadiusMeters] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [status, setStatus] = useState<"ACTIVE" | "INACTIVE">("ACTIVE");
  const [message, setMessage] = useState("");

  const filteredGeofences = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return data;
    return data.filter((item) =>
      [item.business, item.area, item.city, item.status].some((value) =>
        String(value ?? "").toLowerCase().includes(term),
      ),
    );
  }, [data, search]);

  const activeCount = data.filter((item) => item.status === "ACTIVE").length;
  const averageRadius = data.length
    ? Math.round(data.reduce((sum, item) => sum + item.radiusMeters, 0) / data.length)
    : 0;

  function beginEdit(item: GeofenceItem) {
    setEditingId(item.id);
    setRadiusMeters(String(item.radiusMeters));
    setLatitude(item.latitude != null ? String(item.latitude) : "");
    setLongitude(item.longitude != null ? String(item.longitude) : "");
    setStatus(item.status);
    setMessage("");
  }

  function cancelEdit() {
    setEditingId(null);
    setRadiusMeters("");
    setLatitude("");
    setLongitude("");
    setStatus("ACTIVE");
  }

  async function saveGeofence() {
    if (!editingId) return;

    const parsedRadius = Number(radiusMeters);
    const parsedLat = latitude.trim() ? Number(latitude) : undefined;
    const parsedLon = longitude.trim() ? Number(longitude) : undefined;

    if (!Number.isFinite(parsedRadius) || parsedRadius <= 0) {
      setMessage("Please enter a valid radius.");
      return;
    }
    if (parsedLat !== undefined && !Number.isFinite(parsedLat)) {
      setMessage("Please enter a valid latitude.");
      return;
    }
    if (parsedLon !== undefined && !Number.isFinite(parsedLon)) {
      setMessage("Please enter a valid longitude.");
      return;
    }

    await updateGeofence.mutateAsync({
      id: editingId,
      payload: {
        radiusMeters: Math.round(parsedRadius),
        ...(parsedLat !== undefined ? { latitude: parsedLat } : {}),
        ...(parsedLon !== undefined ? { longitude: parsedLon } : {}),
        status,
      },
    });
    setMessage("Geofence updated.");
    cancelEdit();
  }

  return (
    <div className="w-full px-4 py-4 sm:px-6 lg:px-8 lg:py-6">
      <section className="border border-slate-200 bg-white p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Nearby / Geofence Settings</h1>
            <p className="mt-1 text-sm text-slate-500">
              Tune merchant proximity radius used by the Nearby tab and push engine.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3 text-sm">
            <div className="border border-slate-200 px-4 py-3">
              <p className="text-slate-500">Merchants</p>
              <p className="mt-1 text-xl font-semibold text-slate-900">{data.length}</p>
            </div>
            <div className="border border-slate-200 px-4 py-3">
              <p className="text-slate-500">Active</p>
              <p className="mt-1 text-xl font-semibold text-slate-900">{activeCount}</p>
            </div>
            <div className="border border-slate-200 px-4 py-3">
              <p className="text-slate-500">Avg Radius</p>
              <p className="mt-1 text-xl font-semibold text-slate-900">{formatRadius(averageRadius)}</p>
            </div>
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search business, area, or status"
            className="h-11 w-full border border-slate-200 px-3 text-sm outline-none focus:border-[#f97316] sm:max-w-sm"
          />
          {message && <p className="text-sm text-[#315576]">{message}</p>}
        </div>

        <div className="mt-5 overflow-x-auto border border-slate-200">
          <div className="min-w-[980px]">
            <div className="grid grid-cols-[1.4fr_1fr_120px_130px_130px_110px_150px] bg-slate-100 text-sm font-medium text-[#315576]">
              {["Business", "Area", "Radius", "Latitude", "Longitude", "Status", "Action"].map((heading) => (
                <div className="border-r border-slate-300 px-4 py-3 last:border-r-0" key={heading}>
                  {heading}
                </div>
              ))}
            </div>

            {isLoading && <div className="px-4 py-8 text-sm text-slate-500">Loading geofences...</div>}
            {isError && <div className="px-4 py-8 text-sm text-red-600">Unable to load geofences.</div>}
            {!isLoading && !isError && filteredGeofences.length === 0 && (
              <div className="px-4 py-8 text-sm text-slate-500">No geofences found.</div>
            )}

            {filteredGeofences.map((item) => {
              const isEditing = editingId === item.id;

              return (
                <div
                  className="grid grid-cols-[1.4fr_1fr_120px_130px_130px_110px_150px] border-t border-dashed border-slate-200 text-sm"
                  key={item.id}
                >
                  <div className="px-4 py-3 font-medium text-slate-900">{item.business}</div>
                  <div className="px-4 py-3 text-slate-600">{item.area}</div>
                  <div className="px-4 py-3">
                    {isEditing ? (
                      <input
                        value={radiusMeters}
                        onChange={(event) => setRadiusMeters(event.target.value)}
                        className="h-9 w-full border border-slate-200 px-2 outline-none focus:border-[#f97316]"
                      />
                    ) : (
                      formatRadius(item.radiusMeters)
                    )}
                  </div>
                  <div className="px-4 py-3">
                    {isEditing ? (
                      <input
                        value={latitude}
                        onChange={(event) => setLatitude(event.target.value)}
                        className="h-9 w-full border border-slate-200 px-2 outline-none focus:border-[#f97316]"
                      />
                    ) : (
                      formatCoordinate(item.latitude)
                    )}
                  </div>
                  <div className="px-4 py-3">
                    {isEditing ? (
                      <input
                        value={longitude}
                        onChange={(event) => setLongitude(event.target.value)}
                        className="h-9 w-full border border-slate-200 px-2 outline-none focus:border-[#f97316]"
                      />
                    ) : (
                      formatCoordinate(item.longitude)
                    )}
                  </div>
                  <div className="px-4 py-3">
                    {isEditing ? (
                      <select
                        value={status}
                        onChange={(event) => setStatus(event.target.value as "ACTIVE" | "INACTIVE")}
                        className="h-9 w-full border border-slate-200 bg-white px-2 outline-none focus:border-[#f97316]"
                      >
                        <option value="ACTIVE">Active</option>
                        <option value="INACTIVE">Inactive</option>
                      </select>
                    ) : (
                      <span className={item.status === "ACTIVE" ? "text-emerald-700" : "text-slate-500"}>
                        {item.status === "ACTIVE" ? "Active" : "Inactive"}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2 px-4 py-3">
                    {isEditing ? (
                      <>
                        <button
                          onClick={saveGeofence}
                          disabled={updateGeofence.isPending}
                          className="h-9 bg-[#f97316] px-3 text-sm font-medium text-white disabled:opacity-60"
                        >
                          Save
                        </button>
                        <button onClick={cancelEdit} className="h-9 border border-slate-200 px-3 text-sm">
                          Cancel
                        </button>
                      </>
                    ) : (
                      <button onClick={() => beginEdit(item)} className="h-9 border border-slate-200 px-3 text-sm">
                        Edit
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
