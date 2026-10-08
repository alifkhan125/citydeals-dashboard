"use client";

import Image from "next/image";
import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { AxiosError } from "axios";
import Modal from "@/components/Modal";
import { uploadImage } from "@/api/upload";
import {
  type AreaOption,
  type BusinessItem,
  type BusinessPayload,
  type CategoryOption,
} from "@/api/businesses";
import {
  useBusinessAreas,
  useBusinessCategories,
  useBusinesses,
  useCreateBusiness,
  useDeleteBusiness,
  useUpdateBusiness,
} from "@/hooks/useBusinesses";

const assetBase = "/assets/dashboard/";

export default function BusinessesPage() {
  const { data: businessList = [], isLoading: isBusinessesLoading } = useBusinesses();
  const { data: categories = [], isLoading: isCategoriesLoading } = useBusinessCategories();
  const { data: areas = [], isLoading: isAreasLoading } = useBusinessAreas();
  const createBusinessMutation = useCreateBusiness();
  const updateBusinessMutation = useUpdateBusiness();
  const deleteBusinessMutation = useDeleteBusiness();
  const loading = isBusinessesLoading || isCategoriesLoading || isAreasLoading;
  const saving = createBusinessMutation.isPending || updateBusinessMutation.isPending;

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAreaFilter, setSelectedAreaFilter] = useState("ALL");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState("ALL");

  // Drawer / Modal state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingBusiness, setEditingBusiness] = useState<BusinessItem | null>(null);
  const [openActionId, setOpenActionId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Logo file / preview
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [titleText, setTitleText] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [areaId, setAreaId] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"ACTIVE" | "INACTIVE">("ACTIVE");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [instagramUrl, setInstagramUrl] = useState("");
  const [facebookUrl, setFacebookUrl] = useState("");
  const [tiktokUrl, setTikTokUrl] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");

  // Close action menus when clicking outside
  useEffect(() => {
    if (!openActionId) return;
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(".action-menu-container")) {
        setOpenActionId(null);
      }
    };
    window.addEventListener("click", handleClickOutside);
    return () => window.removeEventListener("click", handleClickOutside);
  }, [openActionId]);

  useEffect(() => {
    return () => {
      if (logoPreview && logoPreview.startsWith("blob:")) {
        URL.revokeObjectURL(logoPreview);
      }
    };
  }, [logoPreview]);

  function showToast(message: string) {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3000);
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

  function handleLogoChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (logoPreview && logoPreview.startsWith("blob:")) {
      URL.revokeObjectURL(logoPreview);
    }

    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  }

  function handleAreaChange(newAreaId: string) {
    setAreaId(newAreaId);
    const selectedArea = areas.find((a) => a.id === newAreaId);
    if (selectedArea) {
      if (selectedArea.latitude != null && String(selectedArea.latitude).trim() !== "") {
        setLatitude(String(selectedArea.latitude));
      }
      if (selectedArea.longitude != null && String(selectedArea.longitude).trim() !== "") {
        setLongitude(String(selectedArea.longitude));
      }
    }
  }

  function handleOpenAddBusiness() {
    setOpenActionId(null);
    setEditingBusiness(null);
    setName("");
    setTitleText("");
    setCategoryId("");
    const defaultArea = areas[0];
    const defaultAreaId = defaultArea?.id || "";
    setAreaId(defaultAreaId);
    setAddress("");
    setPhone("");
    setEmail("");
    setStatus("ACTIVE");
    setWebsiteUrl("");
    setInstagramUrl("");
    setFacebookUrl("");
    setTikTokUrl("");
    setLatitude(
      defaultArea?.latitude != null ? String(defaultArea.latitude) : ""
    );
    setLongitude(
      defaultArea?.longitude != null ? String(defaultArea.longitude) : ""
    );
    setLogoFile(null);
    setLogoPreview(null);
    setIsDrawerOpen(true);
  }

  function handleEditBusiness(business: BusinessItem) {
    setOpenActionId(null);
    setEditingBusiness(business);
    setName(business.name || "");
    setTitleText(business.titleText || "");
    setCategoryId(business.categoryId || "");
    const selectedAreaId = business.areaId || areas[0]?.id || "";
    setAreaId(selectedAreaId);
    setAddress(business.address || "");

    const matchedArea = areas.find((a) => a.id === selectedAreaId);
    const effectiveLat =
      business.latitude != null && String(business.latitude).trim() !== ""
        ? String(business.latitude)
        : matchedArea?.latitude != null
        ? String(matchedArea.latitude)
        : "";
    const effectiveLon =
      business.longitude != null && String(business.longitude).trim() !== ""
        ? String(business.longitude)
        : matchedArea?.longitude != null
        ? String(matchedArea.longitude)
        : "";

    setLatitude(effectiveLat);
    setLongitude(effectiveLon);
    setPhone(business.phone || "");
    setEmail(business.email || "");
    setStatus(business.status || "ACTIVE");
    setWebsiteUrl(business.websiteUrl || "");
    setInstagramUrl(business.instagramUrl || "");
    setFacebookUrl(business.facebookUrl || "");
    setTikTokUrl(business.tiktokUrl || "");
    setLogoFile(null);
    setLogoPreview(business.logoUrl || null);
    setIsDrawerOpen(true);
  }

  function handleCloseDrawer() {
    setIsDrawerOpen(false);
    setEditingBusiness(null);
    if (logoPreview && logoPreview.startsWith("blob:")) {
      URL.revokeObjectURL(logoPreview);
    }
    setLogoFile(null);
    setLogoPreview(null);
  }

  async function handleToggleStatus(business: BusinessItem) {
    setOpenActionId(null);
    const nextStatus = business.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    updateBusinessMutation.mutate(
      { id: business.id, payload: { status: nextStatus } },
      {
        onSuccess: () => {
          showToast(`${business.name} ${nextStatus === "ACTIVE" ? "published" : "unpublished"}`);
        },
        onError: (error) => {
          console.error("Failed to toggle business status:", error);
          showToast(getErrorMessage(error, "Failed to update status"));
        },
      },
    );
  }

  async function handleDeleteBusiness(business: BusinessItem) {
    setOpenActionId(null);
    if (!confirm(`Are you sure you want to delete ${business.name}?`)) {
      return;
    }

    deleteBusinessMutation.mutate(business.id, {
      onSuccess: () => {
        showToast(`Deleted ${business.name}`);
      },
      onError: (error) => {
        console.error("Failed to delete business:", error);
        showToast(getErrorMessage(error, "Failed to delete business"));
      },
    });
  }

  async function handleSaveBusiness(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!name.trim()) {
      showToast("Business name is required");
      return;
    }

    if (!address.trim()) {
      showToast("Business address is required");
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

    try {
      let finalLogoUrl = editingBusiness?.logoUrl || undefined;

      // If user selected a new file, upload to Cloudinary
      if (logoFile) {
        showToast("Uploading logo...");
        const uploadRes = await uploadImage(logoFile, "merchants");
        finalLogoUrl = uploadRes.secureUrl || uploadRes.url;
      }

      const payload: BusinessPayload = {
        name: name.trim(),
        titleText: titleText.trim() || undefined,
        categoryId: categoryId || undefined,
        areaId: areaId || areas[0]?.id || undefined,
        address: address.trim(),
        latitude: parsedLat !== undefined && !isNaN(parsedLat) ? parsedLat : undefined,
        longitude: parsedLon !== undefined && !isNaN(parsedLon) ? parsedLon : undefined,
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        websiteUrl: websiteUrl.trim() || undefined,
        instagramUrl: instagramUrl.trim() || undefined,
        facebookUrl: facebookUrl.trim() || undefined,
        tiktokUrl: tiktokUrl.trim() || undefined,
        status,
        ...(finalLogoUrl ? { logoUrl: finalLogoUrl } : {}),
      };

      if (editingBusiness) {
        await updateBusinessMutation.mutateAsync({ id: editingBusiness.id, payload });
        showToast(`Updated ${name.trim()}`);
      } else {
        await createBusinessMutation.mutateAsync(payload);
        showToast(`Created ${name.trim()}`);
      }

      handleCloseDrawer();
    } catch (err: unknown) {
      console.error("Failed to save business:", err);
      showToast(getErrorMessage(err, "Failed to save business"));
    }
  }

  // Filtered businesses
  const filteredBusinesses = useMemo(() => {
    return businessList.filter((b) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        b.name.toLowerCase().includes(q) ||
        (b.titleText && b.titleText.toLowerCase().includes(q)) ||
        (b.address && b.address.toLowerCase().includes(q)) ||
        (b.category?.name && b.category.name.toLowerCase().includes(q)) ||
        (b.area?.name && b.area.name.toLowerCase().includes(q)) ||
        (b.phone && b.phone.toLowerCase().includes(q)) ||
        (b.email && b.email.toLowerCase().includes(q));

      const matchesArea =
        selectedAreaFilter === "ALL" || b.areaId === selectedAreaFilter;

      const matchesStatus =
        selectedStatusFilter === "ALL" || b.status === selectedStatusFilter;

      return matchesSearch && matchesArea && matchesStatus;
    });
  }, [businessList, searchQuery, selectedAreaFilter, selectedStatusFilter]);

  return (
    <div className="w-full p-4 sm:p-6 lg:p-8">
      <section className="rounded-2xl border border-[#d1d5db] bg-white p-4 sm:p-5">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h1 className="m-0 text-lg font-semibold leading-6 text-slate-900">
              Businesses
            </h1>
            <p className="mt-1 text-sm leading-5 text-[#475569]">
              Manage all your verified locations and merchant profiles ({businessList.length} total)
            </p>
          </div>
          <button
            className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#f97316] px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-opacity hover:opacity-95 sm:w-auto"
            type="button"
            onClick={handleOpenAddBusiness}
          >
            <Image src={`${assetBase}imgAdd.svg`} alt="" width={20} height={20} />
            Add New Business
          </button>
        </div>

        {/* Search & Filter Bar */}
        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-md">
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
              <Image src={`${assetBase}imgSearchNormal.svg`} alt="" width={18} height={18} />
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, address, category, phone..."
              className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#f97316] focus:bg-white"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <select
              value={selectedAreaFilter}
              onChange={(e) => setSelectedAreaFilter(e.target.value)}
              className="h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-medium text-slate-700 outline-none transition focus:border-[#f97316] focus:bg-white cursor-pointer"
            >
              <option value="ALL">All Areas</option>
              {areas.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} ({a.city})
                </option>
              ))}
            </select>

            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
              className="h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-medium text-slate-700 outline-none transition focus:border-[#f97316] focus:bg-white cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Draft / Inactive</option>
            </select>
          </div>
        </div>

        {/* Content area */}
        {loading ? (
          <div className="flex h-64 flex-col items-center justify-center gap-3">
            <div className="size-8 animate-spin rounded-full border-4 border-[#f97316] border-t-transparent" />
            <p className="text-sm font-medium text-slate-500">Loading businesses from server...</p>
          </div>
        ) : filteredBusinesses.length === 0 ? (
          <div className="mt-6 flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 py-16 text-center">
            <div className="grid size-12 place-items-center rounded-full bg-orange-50 text-[#f97316]">
              <Image src={`${assetBase}imgShop1.svg`} alt="" width={24} height={24} />
            </div>
            <h3 className="mt-3 text-sm font-semibold text-slate-900">No businesses found</h3>
            <p className="mt-1 text-xs text-slate-500 max-w-sm">
              {searchQuery || selectedAreaFilter !== "ALL" || selectedStatusFilter !== "ALL"
                ? "Try clearing or adjusting your search filters to find what you're looking for."
                : "No business listings created yet. Click 'Add New Business' to create your first partner location."}
            </p>
            <button
              type="button"
              onClick={handleOpenAddBusiness}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#f97316] px-4 py-2 text-xs font-medium text-white shadow-sm transition-opacity hover:opacity-95"
            >
              Add Business
            </button>
          </div>
        ) : (
          <>
            {/* Mobile Cards View */}
            <div className="mt-4 grid gap-3 lg:hidden">
              {filteredBusinesses.map((location) => (
                <article
                  className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                  key={location.id}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 gap-3">
                      <span className="relative size-11 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
                        <Image
                          className="object-cover"
                          src={location.logoUrl || `${assetBase}imgLocationAvatar.png`}
                          alt=""
                          fill
                          sizes="44px"
                        />
                      </span>
                      <div className="min-w-0">
                        <h2 className="truncate text-sm font-semibold text-slate-900">
                          {location.name}
                        </h2>
                        <p className="truncate text-xs text-slate-500">
                          {location.titleText || location.area?.name || "Partner"}
                        </p>
                      </div>
                    </div>

                    <div className="relative shrink-0 action-menu-container">
                      <button
                        aria-expanded={openActionId === location.id}
                        aria-label={`Open actions for ${location.name}`}
                        className="grid size-9 place-items-center rounded-lg border border-slate-300 bg-white text-lg font-bold leading-none text-[#0c4a6e] shadow-sm transition-colors hover:border-[#0c4a6e] hover:bg-sky-50"
                        type="button"
                        onClick={() =>
                          setOpenActionId((currentId) =>
                            currentId === location.id ? null : location.id
                          )
                        }
                      >
                        ⋮
                      </button>
                      {openActionId === location.id && (
                        <div className="absolute right-0 top-11 z-20 w-44 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 text-sm shadow-xl animate-in fade-in zoom-in-95 duration-100">
                          <button
                            className="block w-full px-3.5 py-2 text-left text-slate-700 hover:bg-slate-50"
                            type="button"
                            onClick={() => handleEditBusiness(location)}
                          >
                            Edit
                          </button>
                          <button
                            className="block w-full px-3.5 py-2 text-left text-[#f97316] hover:bg-orange-50"
                            type="button"
                            onClick={() => handleToggleStatus(location)}
                          >
                            {location.status === "ACTIVE" ? "Unpublish" : "Publish"}
                          </button>
                          <button
                            className="block w-full px-3.5 py-2 text-left text-red-600 hover:bg-red-50"
                            type="button"
                            onClick={() => handleDeleteBusiness(location)}
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 text-sm">
                    <div>
                      <span className="block text-xs font-medium text-slate-500">Address</span>
                      <p className="mt-0.5 text-slate-900">{location.address || "—"}</p>
                      {location.latitude != null && location.longitude != null && (
                        <p className="mt-0.5 text-xs text-slate-400">
                          📍 {Number(location.latitude).toFixed(4)}, {Number(location.longitude).toFixed(4)}
                        </p>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="rounded-xl bg-slate-50 p-3">
                        <span className="block text-xs text-slate-500">Category</span>
                        <strong className="text-[#f97316]">
                          {location.category?.name || "General"}
                        </strong>
                      </div>
                      <div className="rounded-xl bg-slate-50 p-3">
                        <span className="block text-xs text-slate-500">Area</span>
                        <strong className="text-slate-900">
                          {location.area?.name || "—"}
                        </strong>
                      </div>
                    </div>
                    <div className="rounded-xl bg-slate-50 p-3">
                      <span className="block text-xs text-slate-500">Contact</span>
                      <p className="mt-0.5 text-slate-900">{location.phone || "—"}</p>
                      <p className="break-all text-xs text-slate-500">{location.email || "—"}</p>
                    </div>
                    <span
                      className={
                        location.status === "ACTIVE"
                          ? "w-fit rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-[#16a34a]"
                          : "w-fit rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600"
                      }
                    >
                      {location.status === "ACTIVE" ? "Active" : "Draft"}
                    </span>
                  </div>
                </article>
              ))}
            </div>

            {/* Desktop Table View */}
            <div className="mt-4 hidden overflow-visible rounded-lg border border-slate-200 lg:block">
              <div className="grid h-[55px] grid-cols-[minmax(220px,1.4fr)_minmax(170px,1fr)_130px_130px_180px_100px_80px] items-center bg-slate-100 text-sm font-medium leading-5 text-[#315576]">
                {[
                  "Location name",
                  "Location",
                  "Category",
                  "Area",
                  "Contact",
                  "Status",
                  "Actions",
                ].map((heading) => (
                  <div className="border-r border-slate-300 px-3 last:border-r-0" key={heading}>
                    {heading}
                  </div>
                ))}
              </div>

              {filteredBusinesses.map((location) => (
                <div
                  className="grid h-[56px] grid-cols-[minmax(220px,1.4fr)_minmax(170px,1fr)_130px_130px_180px_100px_80px] items-center border-b border-dashed border-slate-200 bg-white last:border-b-0 hover:bg-slate-50/50 transition-colors"
                  key={location.id}
                >
                  {/* Name + Logo */}
                  <div className="flex min-w-0 items-center gap-3 px-3 py-2">
                    <span className="relative size-8 shrink-0 overflow-hidden rounded border border-slate-200 bg-slate-100">
                      <Image
                        className="object-cover"
                        src={location.logoUrl || `${assetBase}imgLocationAvatar.png`}
                        alt=""
                        fill
                        sizes="32px"
                      />
                    </span>
                    <span className="min-w-0">
                      <strong className="block truncate text-sm font-medium leading-5 text-slate-900">
                        {location.name}
                      </strong>
                      <small className="block truncate text-xs leading-4 text-[#475569]">
                        {location.titleText || location.area?.name || "Business"}
                      </small>
                    </span>
                  </div>

                  {/* Address */}
                  <div className="min-w-0 px-3">
                    <p className="truncate text-sm leading-5 text-slate-900">
                      {location.address || "—"}
                    </p>
                    {location.latitude != null && location.longitude != null && (
                      <span className="block truncate text-[11px] text-slate-400">
                        📍 {Number(location.latitude).toFixed(4)}, {Number(location.longitude).toFixed(4)}
                      </span>
                    )}
                  </div>

                  {/* Category */}
                  <div className="px-3">
                    <span className="inline-flex h-6 items-center rounded bg-orange-50 px-2 text-xs font-medium leading-5 text-[#f97316]">
                      {location.category?.name || "General"}
                    </span>
                  </div>

                  {/* Area */}
                  <p className="truncate px-3 text-sm leading-5 font-medium text-slate-900">
                    {location.area?.name || "—"}
                  </p>

                  {/* Contact */}
                  <div className="min-w-0 px-3">
                    <strong className="block truncate text-sm font-normal leading-5 text-slate-900">
                      {location.phone || "—"}
                    </strong>
                    <small className="block truncate text-xs leading-4 text-[#475569]">
                      {location.email || "—"}
                    </small>
                  </div>

                  {/* Status */}
                  <div className="px-3">
                    <span
                      className={
                        location.status === "ACTIVE"
                          ? "inline-flex h-6 items-center rounded bg-emerald-100 px-2 text-xs font-medium leading-5 text-[#16a34a]"
                          : "inline-flex h-6 items-center rounded bg-slate-100 px-2 text-xs font-medium leading-5 text-slate-600"
                      }
                    >
                      {location.status === "ACTIVE" ? "Active" : "Draft"}
                    </span>
                  </div>

                  {/* Actions Dropdown */}
                  <div className="relative flex items-center justify-center px-3 action-menu-container">
                    <button
                      aria-expanded={openActionId === location.id}
                      aria-label={`Open actions for ${location.name}`}
                      className="grid size-9 place-items-center rounded-lg border border-slate-300 bg-white text-lg font-bold leading-none text-[#0c4a6e] shadow-sm transition-colors hover:border-[#0c4a6e] hover:bg-sky-50"
                      type="button"
                      onClick={() =>
                        setOpenActionId((currentId) =>
                          currentId === location.id ? null : location.id
                        )
                      }
                    >
                      ⋮
                    </button>
                    {openActionId === location.id && (
                      <div className="absolute right-3 top-10 z-20 w-44 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 text-sm shadow-xl animate-in fade-in zoom-in-95 duration-100">
                        <button
                          className="block w-full px-3.5 py-2 text-left text-slate-700 hover:bg-slate-50"
                          type="button"
                          onClick={() => handleEditBusiness(location)}
                        >
                          Edit
                        </button>
                        <button
                          className="block w-full px-3.5 py-2 text-left text-[#f97316] hover:bg-orange-50"
                          type="button"
                          onClick={() => handleToggleStatus(location)}
                        >
                          {location.status === "ACTIVE" ? "Unpublish" : "Publish"}
                        </button>
                        <button
                          className="block w-full px-3.5 py-2 text-left text-red-600 hover:bg-red-50"
                          type="button"
                          onClick={() => handleDeleteBusiness(location)}
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

      {/* Add / Edit Business Modal */}
      <Modal
        isOpen={isDrawerOpen}
        onClose={handleCloseDrawer}
        title={editingBusiness ? "Edit Business" : "Add New Business"}
        subtitle={
          editingBusiness
            ? `Update details for ${editingBusiness.name}`
            : "Enter business profile details"
        }
        maxWidth="max-w-[640px]"
      >
        <form className="flex flex-col gap-4" onSubmit={handleSaveBusiness}>
          {/* Logo Upload Card */}
          <div className="flex w-full items-center gap-5 rounded-2xl border border-[#e5e7eb] bg-gray-50 p-4">
            <div className="relative size-16 shrink-0 overflow-hidden rounded-xl border-2 border-[#d1d5db] bg-white shadow-inner">
              <Image
                className="object-cover"
                src={logoPreview ?? `${assetBase}imgBusinessLogo.png`}
                alt=""
                fill
                sizes="64px"
              />
            </div>
            <div className="flex-1">
              <label
                className="inline-flex h-10 cursor-pointer items-center justify-center rounded-lg border border-[#e5e7eb] bg-white px-4 text-sm font-medium text-gray-900 shadow-sm transition hover:bg-gray-100"
                htmlFor="business-logo-upload"
              >
                Upload Logo
                <input
                  className="sr-only"
                  id="business-logo-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleLogoChange}
                />
              </label>
              <p className="mt-1 text-xs text-slate-500">
                PNG, JPG or WebP up to 10MB
              </p>
            </div>
          </div>

          {/* Form Fields Card */}
          <div className="rounded-2xl border border-[#e5e7eb] bg-white p-4">
            <div className="grid grid-cols-1 gap-x-4 gap-y-3 md:grid-cols-12">
              {/* Business Name */}
              <label className="grid min-w-0 gap-1 md:col-span-6">
                <span className="text-xs font-medium text-slate-700">
                  Business Name <span className="text-red-500">*</span>
                </span>
                <span className="flex h-10 min-w-0 items-center rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 focus-within:border-[#f97316] focus-within:bg-white transition">
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full min-w-0 flex-1 truncate bg-transparent outline-none placeholder:text-slate-400"
                    placeholder="e.g. Madrid Coffee Club"
                  />
                </span>
              </label>

              {/* Title Text / Tagline */}
              <label className="grid min-w-0 gap-1 md:col-span-6">
                <span className="text-xs font-medium text-slate-700">
                  Title text / Tagline
                </span>
                <span className="flex h-10 min-w-0 items-center rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 focus-within:border-[#f97316] focus-within:bg-white transition">
                  <input
                    value={titleText}
                    onChange={(e) => setTitleText(e.target.value)}
                    className="w-full min-w-0 flex-1 truncate bg-transparent outline-none placeholder:text-slate-400"
                    placeholder="e.g. Artisanal Espresso & Pastries"
                  />
                </span>
              </label>

              {/* Category */}
              <label className="grid min-w-0 gap-1 md:col-span-6">
                <span className="text-xs font-medium text-slate-700">Category</span>
                <span className="flex h-10 min-w-0 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 focus-within:border-[#f97316] focus-within:bg-white transition">
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full min-w-0 flex-1 truncate bg-transparent outline-none cursor-pointer"
                  >
                    <option value="">Select category</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </span>
              </label>

              {/* Area */}
              <label className="grid min-w-0 gap-1 md:col-span-6">
                <span className="text-xs font-medium text-slate-700">
                  Area <span className="text-red-500">*</span>
                </span>
                <span className="flex h-10 min-w-0 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 focus-within:border-[#f97316] focus-within:bg-white transition">
                  <select
                    value={areaId}
                    onChange={(e) => handleAreaChange(e.target.value)}
                    required
                    className="w-full min-w-0 flex-1 truncate bg-transparent outline-none cursor-pointer"
                  >
                    <option value="">Select area</option>
                    {areas.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name} ({a.city})
                      </option>
                    ))}
                  </select>
                </span>
              </label>

              {/* Address */}
              <label className="grid min-w-0 gap-1 md:col-span-12">
                <span className="text-xs font-medium text-slate-700">
                  Address <span className="text-red-500">*</span>
                </span>
                <span className="flex h-10 min-w-0 items-center rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 focus-within:border-[#f97316] focus-within:bg-white transition">
                  <input
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    required
                    className="w-full min-w-0 flex-1 truncate bg-transparent outline-none placeholder:text-slate-400"
                    placeholder="e.g. Gran Vía 42, Madrid"
                  />
                </span>
              </label>

              {/* Coordinates (Latitude & Longitude) */}
              <label className="grid min-w-0 gap-1 md:col-span-6">
                <span className="text-xs font-medium text-slate-700">
                  Latitude (অক্ষাংশ)
                </span>
                <span className="flex h-10 min-w-0 items-center rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 focus-within:border-[#f97316] focus-within:bg-white transition">
                  <input
                    type="number"
                    step="any"
                    value={latitude}
                    onChange={(e) => setLatitude(e.target.value)}
                    className="w-full min-w-0 flex-1 truncate bg-transparent outline-none placeholder:text-slate-400"
                    placeholder="Auto-filled from Area"
                  />
                </span>
              </label>

              <label className="grid min-w-0 gap-1 md:col-span-6">
                <span className="text-xs font-medium text-slate-700">
                  Longitude (দ্রাঘিমাংশ)
                </span>
                <span className="flex h-10 min-w-0 items-center rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 focus-within:border-[#f97316] focus-within:bg-white transition">
                  <input
                    type="number"
                    step="any"
                    value={longitude}
                    onChange={(e) => setLongitude(e.target.value)}
                    className="w-full min-w-0 flex-1 truncate bg-transparent outline-none placeholder:text-slate-400"
                    placeholder="Auto-filled from Area"
                  />
                </span>
              </label>

              <div className="md:col-span-12 -mt-1 mb-1 flex flex-wrap items-center justify-between gap-1 text-[11px] text-slate-500">
                <p>
                  ⚡ Area সিলেক্ট করলেই অক্ষাংশ ও দ্রাঘিমাংশ স্বয়ংক্রিয়ভাবে বসে যাবে। প্রয়োজন হলে নির্দিষ্ট দোকানের লোকেশন অনুযায়ী পরিবর্তন করতে পারেন।
                </p>
                {areaId && (
                  <button
                    type="button"
                    onClick={() => {
                      const selectedArea = areas.find((a) => a.id === areaId);
                      if (selectedArea) {
                        setLatitude(selectedArea.latitude != null ? String(selectedArea.latitude) : "");
                        setLongitude(selectedArea.longitude != null ? String(selectedArea.longitude) : "");
                        showToast("Area এর স্থানাঙ্ক দিয়ে অটো-ফিল করা হয়েছে");
                      }
                    }}
                    className="shrink-0 font-medium text-[#f97316] hover:underline cursor-pointer"
                  >
                    🔄 Reset to Area
                  </button>
                )}
              </div>

              {/* Phone & Email */}
              <label className="grid min-w-0 gap-1 md:col-span-6">
                <span className="text-xs font-medium text-slate-700">Phone</span>
                <span className="flex h-10 min-w-0 items-center rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 focus-within:border-[#f97316] focus-within:bg-white transition">
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full min-w-0 flex-1 truncate bg-transparent outline-none placeholder:text-slate-400"
                    placeholder="e.g. +34 912 345 678"
                  />
                </span>
              </label>

              <label className="grid min-w-0 gap-1 md:col-span-6">
                <span className="text-xs font-medium text-slate-700">Email</span>
                <span className="flex h-10 min-w-0 items-center rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 focus-within:border-[#f97316] focus-within:bg-white transition">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full min-w-0 flex-1 truncate bg-transparent outline-none placeholder:text-slate-400"
                    placeholder="e.g. contact@business.com"
                  />
                </span>
              </label>

              {/* Status */}
              <label className="grid min-w-0 gap-1 md:col-span-12">
                <span className="text-xs font-medium text-slate-700">Status</span>
                <span className="flex h-10 min-w-0 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 focus-within:border-[#f97316] focus-within:bg-white transition">
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as "ACTIVE" | "INACTIVE")}
                    className="w-full min-w-0 flex-1 truncate bg-transparent outline-none cursor-pointer"
                  >
                    <option value="ACTIVE">Active (Published)</option>
                    <option value="INACTIVE">Draft (Hidden)</option>
                  </select>
                </span>
              </label>

              {/* Social Links */}
              <div className="grid min-w-0 gap-3 md:col-span-6">
                <label className="grid min-w-0 gap-1">
                  <span className="text-xs font-medium text-slate-700">Website</span>
                  <span className="flex h-10 min-w-0 items-center rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 focus-within:border-[#f97316] focus-within:bg-white transition">
                    <input
                      value={websiteUrl}
                      onChange={(e) => setWebsiteUrl(e.target.value)}
                      className="w-full min-w-0 flex-1 truncate bg-transparent outline-none placeholder:text-slate-400"
                      placeholder="https://www.example.com"
                    />
                  </span>
                </label>

                <label className="grid min-w-0 gap-1">
                  <span className="text-xs font-medium text-slate-700">Instagram</span>
                  <span className="flex h-10 min-w-0 items-center rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 focus-within:border-[#f97316] focus-within:bg-white transition">
                    <input
                      value={instagramUrl}
                      onChange={(e) => setInstagramUrl(e.target.value)}
                      className="w-full min-w-0 flex-1 truncate bg-transparent outline-none placeholder:text-slate-400"
                      placeholder="https://instagram.com/username"
                    />
                  </span>
                </label>
              </div>

              <div className="grid min-w-0 gap-3 md:col-span-6">
                <label className="grid min-w-0 gap-1">
                  <span className="text-xs font-medium text-slate-700">Facebook</span>
                  <span className="flex h-10 min-w-0 items-center rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 focus-within:border-[#f97316] focus-within:bg-white transition">
                    <input
                      value={facebookUrl}
                      onChange={(e) => setFacebookUrl(e.target.value)}
                      className="w-full min-w-0 flex-1 truncate bg-transparent outline-none placeholder:text-slate-400"
                      placeholder="https://facebook.com/username"
                    />
                  </span>
                </label>

                <label className="grid min-w-0 gap-1">
                  <span className="text-xs font-medium text-slate-700">TikTok</span>
                  <span className="flex h-10 min-w-0 items-center rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 focus-within:border-[#f97316] focus-within:bg-white transition">
                    <input
                      value={tiktokUrl}
                      onChange={(e) => setTikTokUrl(e.target.value)}
                      className="w-full min-w-0 flex-1 truncate bg-transparent outline-none placeholder:text-slate-400"
                      placeholder="https://tiktok.com/@username"
                    />
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex w-full gap-3 pt-2">
            <button
              className="h-11 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:opacity-50"
              type="button"
              disabled={saving}
              onClick={handleCloseDrawer}
            >
              Cancel
            </button>
            <button
              className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-[#f97316] px-4 text-sm font-medium text-white shadow-sm transition hover:opacity-95 disabled:opacity-50"
              type="submit"
              disabled={saving}
            >
              {saving ? (
                <>
                  <div className="size-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Saving...
                </>
              ) : editingBusiness ? (
                "Save Changes"
              ) : (
                "Save Business"
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* Floating Toast Notice */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-medium text-white shadow-xl animate-in fade-in slide-in-from-bottom-2 duration-150">
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
