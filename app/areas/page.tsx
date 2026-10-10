"use client";

import { useState } from "react";
import { AxiosError } from "axios";
import Modal from "@/components/Modal";
import OpenStreetMapPreview from "@/components/OpenStreetMapPreview";
import { type AreaItem, type AreaPayload } from "@/api/areas";
import { geocodingApi } from "@/api/geocoding";
import { useAreas, useCreateArea, useDeleteArea, useUpdateArea } from "@/hooks/useAreas";

export default function AreasPage() {
  const { data: areaList = [], isLoading: loading } = useAreas();
  const createAreaMutation = useCreateArea();
  const updateAreaMutation = useUpdateArea();
  const deleteAreaMutation = useDeleteArea();
  const saving = createAreaMutation.isPending || updateAreaMutation.isPending;
  const [isAddAreaOpen, setIsAddAreaOpen] = useState(false);
  const [editingArea, setEditingArea] = useState<AreaItem | null>(null);
  const [openActionSlug, setOpenActionSlug] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form states (clean and simple: name, slug, city, state)
  const [areaName, setAreaName] = useState("");
  const [areaSlug, setAreaSlug] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("Madrid");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [areaSearch, setAreaSearch] = useState("");
  const [areaSuggestions, setAreaSuggestions] = useState<
    Awaited<ReturnType<typeof geocodingApi.suggestions>>
  >([]);
  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(false);

  function showToast(message: string) {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 2500);
  }

  async function handleFindAreaCoordinates() {
    const query = [areaName, city, state].filter(Boolean).join(", ");
    if (!query.trim()) {
      showToast("Enter an area name or city first");
      return;
    }

    try {
      setIsGeocoding(true);
      const result = await geocodingApi.search(query);
      setLatitude(String(result.latitude));
      setLongitude(String(result.longitude));
      showToast(`Found coordinates using ${result.provider}`);
    } catch (error) {
      console.error("Failed to find area coordinates:", error);
      showToast(getErrorMessage(error, "No coordinates found for this area"));
    } finally {
      setIsGeocoding(false);
    }
  }

  function setGeneratedSlug(value: string) {
    if (!editingArea && !isSlugManuallyEdited) {
      setAreaSlug(
        value
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "")
      );
    }
  }

  async function handleSearchAreaSuggestions() {
    const query = areaSearch.trim() || [areaName, city, state].filter(Boolean).join(", ");
    if (!query.trim()) {
      showToast("Enter a location to search");
      return;
    }

    try {
      setIsGeocoding(true);
      const results = await geocodingApi.suggestions(query);
      setAreaSuggestions(results);
      if (results.length === 0) {
        showToast("No location suggestions found");
      }
    } catch (error) {
      console.error("Failed to search area suggestions:", error);
      showToast(getErrorMessage(error, "Could not search locations"));
    } finally {
      setIsGeocoding(false);
    }
  }

  function handleSelectSuggestion(result: Awaited<ReturnType<typeof geocodingApi.suggestions>>[number]) {
    const nextName = result.name || areaName || result.city || "New Area";
    setAreaName(nextName);
    setGeneratedSlug(nextName);
    if (result.city) setCity(result.city);
    if (result.state) setState(result.state);
    setLatitude(String(result.latitude));
    setLongitude(String(result.longitude));
    setAreaSearch(result.label);
    setAreaSuggestions([]);
    showToast("Location selected from OpenStreetMap");
  }

  function getErrorMessage(error: unknown, fallback: string) {
    if (error instanceof AxiosError) {
      const message = error.response?.data?.message;
      if (Array.isArray(message)) return message.join(", ");
      if (typeof message === "string") return message;
      if (typeof error.response?.data?.error === "string") return error.response.data.error;
    }
    if (error instanceof Error) return error.message;
    return fallback;
  }

  const handleAreaNameChange = (value: string) => {
    setAreaName(value);
    setGeneratedSlug(value);
  };

  const handleAreaSlugChange = (value: string) => {
    setIsSlugManuallyEdited(true);
    setAreaSlug(
      value
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, "")
    );
  };

  const handleOpenAddArea = () => {
    setOpenActionSlug(null);
    setEditingArea(null);
    setAreaName("");
    setAreaSlug("");
    setIsSlugManuallyEdited(false);
    setCity("");
    setState("Madrid");
    setLatitude("");
    setLongitude("");
    setAreaSearch("");
    setAreaSuggestions([]);
    setIsAddAreaOpen(true);
  };

  const handleEditArea = (area: AreaItem) => {
    setOpenActionSlug(null);
    setEditingArea(area);
    setAreaName(area.name);
    setAreaSlug(area.slug);
    setIsSlugManuallyEdited(true);
    setCity(area.city);
    setState(area.state);
    setLatitude(area.latitude != null ? String(area.latitude) : "");
    setLongitude(area.longitude != null ? String(area.longitude) : "");
    setAreaSearch([area.name, area.city, area.state].filter(Boolean).join(", "));
    setAreaSuggestions([]);
    setIsAddAreaOpen(true);
  };

  const handleCloseAreaModal = () => {
    setIsAddAreaOpen(false);
    setEditingArea(null);
    setAreaName("");
    setAreaSlug("");
    setIsSlugManuallyEdited(false);
    setCity("");
    setState("Madrid");
    setLatitude("");
    setLongitude("");
    setAreaSearch("");
    setAreaSuggestions([]);
  };

  const handleSaveArea = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!areaName.trim() || !city.trim()) {
      showToast("Area name and City are required");
      return;
    }

    const parsedLat = latitude.trim() !== "" ? parseFloat(latitude.trim()) : undefined;
    const parsedLon = longitude.trim() !== "" ? parseFloat(longitude.trim()) : undefined;

    if (parsedLat !== undefined && isNaN(parsedLat)) {
      showToast("Please enter a valid Latitude number");
      return;
    }
    if (parsedLon !== undefined && isNaN(parsedLon)) {
      showToast("Please enter a valid Longitude number");
      return;
    }

    const slug =
      areaSlug.trim() ||
      areaName
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

    const payload: AreaPayload = {
      name: areaName.trim(),
      slug,
      city: city.trim(),
      state: state.trim().toUpperCase(),
      ...(parsedLat !== undefined && !isNaN(parsedLat) ? { latitude: parsedLat } : {}),
      ...(parsedLon !== undefined && !isNaN(parsedLon) ? { longitude: parsedLon } : {}),
    };

    try {
      if (editingArea) {
        await updateAreaMutation.mutateAsync({ id: editingArea.id, payload });
        showToast(`Updated ${areaName.trim()} area`);
      } else {
        await createAreaMutation.mutateAsync(payload);
        showToast(`Added ${areaName.trim()} area`);
      }

      handleCloseAreaModal();
    } catch (err: unknown) {
      console.error("Failed to save area:", err);
      showToast(getErrorMessage(err, "Failed to save area"));
    }
  };

  const handleDeleteArea = async (area: AreaItem) => {
    setOpenActionSlug(null);
    if (!confirm(`Are you sure you want to delete ${area.name}?`)) return;
    deleteAreaMutation.mutate(area.id, {
      onSuccess: () => showToast(`Deleted ${area.name} area`),
      onError: (err) => {
        console.error("Failed to delete area:", err);
        showToast(getErrorMessage(err, "Failed to delete area"));
      },
    });
  };

  const totalMerchants = areaList.reduce((sum, a) => sum + (a._count?.merchants || 0), 0);
  const totalCoupons = areaList.reduce((sum, a) => sum + (a._count?.coupons || 0), 0);

  return (
    <div className="w-full px-4 py-4 sm:px-6 lg:px-8 lg:py-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Areas / Directories</h1>
            <p className="mt-1 text-sm text-slate-500">
              Manage isolated city directories, app landing links and area QR destinations.
            </p>
          </div>
          <button
            className="h-11 w-full rounded-xl bg-[#f97316] px-4 text-sm font-medium text-white transition-opacity hover:opacity-95 sm:w-auto"
            type="button"
            onClick={handleOpenAddArea}
          >
            Add area
          </button>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[
            `Total areas: ${areaList.length}`,
            `Total merchants: ${totalMerchants}`,
            `Total active coupons: ${totalCoupons}`,
          ].map((item) => (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4" key={item}>
              <p className="text-sm font-medium text-slate-700">{item}</p>
            </div>
          ))}
        </div>

        {loading ? (
          <div className="flex h-48 items-center justify-center text-sm text-slate-500">
            Loading areas from server...
          </div>
        ) : areaList.length === 0 ? (
          <div className="flex h-48 flex-col items-center justify-center gap-2 text-slate-500">
            <p className="text-sm">No areas found.</p>
            <button
              onClick={handleOpenAddArea}
              className="text-sm font-medium text-orange-600 hover:underline"
            >
              + Add your first city area
            </button>
          </div>
        ) : (
          <>
            {/* Mobile list */}
            <div className="mt-5 grid gap-3 md:hidden">
              {areaList.map((area) => (
                <article className="rounded-2xl border border-slate-200 bg-white p-4" key={area.id || area.slug}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="truncate text-base font-semibold text-slate-900">{area.name}</h2>
                      <p className="mt-1 text-sm text-slate-500">
                        {area.city}, {area.state}
                      </p>
                      <p className="mt-1 break-all text-xs text-slate-500">/directory/{area.slug}</p>
                    </div>
                    <div className="relative shrink-0">
                      <button
                        aria-expanded={openActionSlug === area.slug}
                        aria-label={`Open actions for ${area.name}`}
                        className="grid size-9 place-items-center rounded-lg border border-slate-300 bg-white text-lg font-bold leading-none text-[#0c4a6e] shadow-sm transition-colors hover:border-[#0c4a6e] hover:bg-sky-50"
                        type="button"
                        onClick={() =>
                          setOpenActionSlug((currentSlug) =>
                            currentSlug === area.slug ? null : area.slug
                          )
                        }
                      >
                        ⋮
                      </button>
                      {openActionSlug === area.slug && (
                        <div className="absolute right-0 top-11 z-20 w-44 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 text-sm shadow-xl">
                          <button
                            className="block w-full px-3.5 py-2 text-left text-slate-700 hover:bg-slate-50"
                            type="button"
                            onClick={() => handleEditArea(area)}
                          >
                            Edit
                          </button>
                          <button
                            className="block w-full px-3.5 py-2 text-left text-red-600 hover:bg-red-50"
                            type="button"
                            onClick={() => handleDeleteArea(area)}
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-2 text-center text-sm">
                    <div className="rounded-xl bg-slate-50 p-3">
                      <span className="block text-xs text-slate-500">Merchants</span>
                      <strong className="text-slate-900">{area._count?.merchants ?? 0}</strong>
                    </div>
                    <div className="rounded-xl bg-slate-50 p-3">
                      <span className="block text-xs text-slate-500">Coupons</span>
                      <strong className="text-slate-900">{area._count?.coupons ?? 0}</strong>
                    </div>
                    <div className="rounded-xl bg-slate-50 p-3">
                      <span className="block text-xs text-slate-500">QR</span>
                      <strong className="text-xs font-semibold text-emerald-700">
                        {area.qrCodeUrl ? "Ready" : "Ready"}
                      </strong>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            {/* Desktop table */}
            <div className="mt-5 hidden overflow-x-auto overflow-y-visible rounded-xl border border-slate-200 md:block">
              <div className="grid grid-cols-[1.2fr_1fr_120px_120px_120px_90px] bg-slate-100 text-sm text-[#315576]">
                {["Area", "Directory URL", "Merchants", "Coupons", "QR", "Actions"].map((h) => (
                  <div className="border-r border-slate-300 px-4 py-3 last:border-r-0" key={h}>
                    {h}
                  </div>
                ))}
              </div>
              {areaList.map((area) => (
                <div
                  className="grid grid-cols-[1.2fr_1fr_120px_120px_120px_90px] border-t border-dashed border-slate-200 text-sm"
                  key={area.id || area.slug}
                >
                  <div className="px-4 py-3">
                    <strong>{area.name}</strong>
                    <p className="text-xs text-slate-500">
                      {area.city}, {area.state}
                    </p>
                  </div>
                  <div className="px-4 py-3 text-slate-700">/directory/{area.slug}</div>
                  <div className="px-4 py-3">{area._count?.merchants ?? 0}</div>
                  <div className="px-4 py-3">{area._count?.coupons ?? 0}</div>
                  <div className="px-4 py-3">
                    <span className="rounded bg-emerald-100 px-2 py-1 text-xs text-emerald-700">
                      {area.qrCodeUrl ? "Ready" : "Ready"}
                    </span>
                  </div>
                  <div className="relative flex justify-center px-4 py-3">
                    <button
                      aria-expanded={openActionSlug === area.slug}
                      aria-label={`Open actions for ${area.name}`}
                      className="grid size-9 place-items-center rounded-lg border border-slate-300 bg-white text-lg font-bold leading-none text-[#0c4a6e] shadow-sm transition-colors hover:border-[#0c4a6e] hover:bg-sky-50"
                      type="button"
                      onClick={() =>
                        setOpenActionSlug((currentSlug) =>
                          currentSlug === area.slug ? null : area.slug
                        )
                      }
                    >
                      ⋮
                    </button>
                    {openActionSlug === area.slug && (
                      <div className="absolute right-4 top-12 z-20 w-44 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 text-sm shadow-xl">
                        <button
                          className="block w-full px-3.5 py-2 text-left text-slate-700 hover:bg-slate-50"
                          type="button"
                          onClick={() => handleEditArea(area)}
                        >
                          Edit
                        </button>
                        <button
                          className="block w-full px-3.5 py-2 text-left text-red-600 hover:bg-red-50"
                          type="button"
                          onClick={() => handleDeleteArea(area)}
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </section>

      <Modal
        isOpen={isAddAreaOpen}
        onClose={handleCloseAreaModal}
        title={editingArea ? "Edit Area" : "Add Area"}
        subtitle={
          editingArea
            ? `Update ${editingArea.name} directory`
            : "Create a new city directory for the mobile app"
        }
        maxWidth="max-w-[760px]"
      >
        <form className="flex flex-col gap-4" onSubmit={handleSaveArea}>
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="grid gap-3.5">
              <label className="grid gap-1">
                <span className="text-sm leading-5 text-slate-900">Area name *</span>
                <input
                  required
                  className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-3.5 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-orange-400 focus:bg-white"
                  placeholder="e.g. Kendall"
                  value={areaName}
                  onChange={(event) => handleAreaNameChange(event.target.value)}
                />
              </label>

              <label className="grid gap-1">
                <span className="text-sm leading-5 text-slate-900">Directory slug *</span>
                <input
                  required
                  className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-3.5 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-orange-400 focus:bg-white"
                  placeholder="e.g. kendall"
                  value={areaSlug}
                  onChange={(event) => handleAreaSlugChange(event.target.value)}
                />
              </label>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="grid gap-1">
                  <span className="text-sm leading-5 text-slate-900">City *</span>
                  <input
                    required
                    className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-3.5 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-orange-400 focus:bg-white"
                    placeholder="Miami"
                    value={city}
                    onChange={(event) => setCity(event.target.value)}
                  />
                </label>

                <label className="grid gap-1">
                  <span className="text-sm leading-5 text-slate-900">State</span>
                  <input
                    className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-3.5 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-orange-400 focus:bg-white"
                    placeholder="FL"
                    value={state}
                    onChange={(event) => setState(event.target.value)}
                  />
                </label>
              </div>

              <div className="-mt-1 flex justify-end">
                <button
                  type="button"
                  onClick={handleFindAreaCoordinates}
                  disabled={isGeocoding || (!areaName.trim() && !city.trim())}
                  className="inline-flex h-9 items-center justify-center rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isGeocoding ? "Finding location..." : "Find center coordinates"}
                </button>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="grid gap-1">
                  <span className="text-sm leading-5 text-slate-900">Center Latitude</span>
                  <input
                    type="number"
                    step="any"
                    className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-3.5 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-orange-400 focus:bg-white"
                    placeholder="e.g. 40.4168"
                    value={latitude}
                    onChange={(event) => setLatitude(event.target.value)}
                  />
                </label>

                <label className="grid gap-1">
                  <span className="text-sm leading-5 text-slate-900">Center Longitude</span>
                  <input
                    type="number"
                    step="any"
                    className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-3.5 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-orange-400 focus:bg-white"
                    placeholder="e.g. -3.7038"
                    value={longitude}
                    onChange={(event) => setLongitude(event.target.value)}
                  />
                </label>
              </div>
              <p className="text-xs text-slate-500 -mt-1">
                Center coordinates for this area. New businesses will use these coordinates automatically when no specific store location is provided.
              </p>

              <OpenStreetMapPreview
                latitude={latitude}
                longitude={longitude}
                label={areaName || city || "Area center"}
                searchSlot={
                  <div className="rounded-xl border border-slate-200 bg-white/95 p-2 shadow-lg backdrop-blur">
                    <div className="flex gap-2">
                      <input
                        className="h-10 min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-orange-400"
                        placeholder="Search area, city, neighborhood..."
                        value={areaSearch}
                        onChange={(event) => setAreaSearch(event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") {
                            event.preventDefault();
                            handleSearchAreaSuggestions();
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={handleSearchAreaSuggestions}
                        disabled={isGeocoding}
                        className="h-10 shrink-0 rounded-lg bg-[#f97316] px-3 text-xs font-semibold text-white shadow-sm transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {isGeocoding ? "..." : "Search"}
                      </button>
                    </div>
                    {areaSuggestions.length > 0 && (
                      <div className="mt-2 max-h-44 overflow-y-auto rounded-lg border border-slate-200 bg-white">
                        {areaSuggestions.map((item) => (
                          <button
                            key={`${item.latitude}-${item.longitude}-${item.label}`}
                            type="button"
                            onClick={() => handleSelectSuggestion(item)}
                            className="block w-full border-b border-slate-100 px-3 py-2 text-left text-xs text-slate-700 transition last:border-b-0 hover:bg-orange-50"
                          >
                            <span className="block font-medium text-slate-900">
                              {item.name || item.city || "Location"}
                            </span>
                            <span className="mt-0.5 block line-clamp-2 text-slate-500">
                              {item.label}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                }
                onPick={(coords) => {
                  setLatitude(String(coords.latitude));
                  setLongitude(String(coords.longitude));
                }}
              />
            </div>
          </div>

          <div className="flex gap-3">
            <button
              className="h-11 flex-1 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-800 transition-colors hover:bg-slate-50"
              type="button"
              onClick={handleCloseAreaModal}
              disabled={saving}
            >
              Cancel
            </button>
            <button
              className="h-11 flex-1 rounded-xl bg-[#f97316] text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-95 disabled:opacity-50"
              type="submit"
              disabled={saving}
            >
              {saving ? "Saving..." : editingArea ? "Save Changes" : "Save Area"}
            </button>
          </div>
        </form>
      </Modal>

      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-medium text-white shadow-xl">
          {toastMessage}
        </div>
      )}
    </div>
  );
}
