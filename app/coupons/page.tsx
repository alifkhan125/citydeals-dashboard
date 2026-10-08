"use client";

import Image from "next/image";
import { useEffect, useState, type ChangeEvent } from "react";
import { AxiosError } from "axios";
import Modal from "@/components/Modal";
import { uploadImage } from "@/api/upload";
import { type CouponItem, type CouponPayload } from "@/api/coupons";
import {
  useCouponCategories,
  useCouponMerchants,
  useCoupons,
  useCreateCoupon,
  useDeleteCoupon,
  useUpdateCoupon,
} from "@/hooks/useCoupons";

const assetBase = "/assets/dashboard/";

export default function CouponsPage() {
  const { data: coupons = [], isLoading: isCouponsLoading } = useCoupons();
  const { data: merchants = [], isLoading: isMerchantsLoading } = useCouponMerchants();
  const { data: categories = [], isLoading: isCategoriesLoading } = useCouponCategories();
  const createCouponMutation = useCreateCoupon();
  const updateCouponMutation = useUpdateCoupon();
  const deleteCouponMutation = useDeleteCoupon();
  const loading = isCouponsLoading || isMerchantsLoading || isCategoriesLoading;
  const saving = createCouponMutation.isPending || updateCouponMutation.isPending;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [editingCoupon, setEditingCoupon] = useState<CouponItem | null>(null);
  const [openActionId, setOpenActionId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [merchantFilter, setMerchantFilter] = useState("All merchants");
  const [statusFilter, setStatusFilter] = useState("All statuses");

  // Form states
  const [offer, setOffer] = useState("");
  const [business, setBusiness] = useState("");
  const [category, setCategory] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [redemptionLimit, setRedemptionLimit] = useState("");
  const [expires, setExpires] = useState("");
  const [frequency, setFrequency] = useState("One-time use");
  const [discussion, setDiscussion] = useState("");
  const [terms, setTerms] = useState("");

  useEffect(() => {
    return () => {
      if (logoPreview && logoPreview.startsWith("blob:")) {
        URL.revokeObjectURL(logoPreview);
      }
    };
  }, [logoPreview]);

  function handleLogoChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setLogoFile(file);
    const nextPreview = URL.createObjectURL(file);
    setLogoPreview(nextPreview);
  }

  function showToast(message: string) {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 2500);
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

  function handleOpenNewCoupon() {
    setOpenActionId(null);
    setEditingCoupon(null);
    setOffer("");
    setBusiness(merchants[0]?.id || "");
    setCategory(categories[0]?.id || "");
    setCouponCode("");
    setRedemptionLimit("");
    setExpires("");
    setFrequency("One-time use");
    setDiscussion("");
    setTerms("");
    setLogoFile(null);
    setLogoPreview(null);
    setIsModalOpen(true);
  }

  function handleCloseModal() {
    setIsModalOpen(false);
    setEditingCoupon(null);
    setLogoFile(null);
    setLogoPreview(null);
  }

  function handleEditCoupon(coupon: CouponItem) {
    setOpenActionId(null);
    setEditingCoupon(coupon);
    setOffer(coupon.title);
    setBusiness(coupon.merchantId || coupon.merchant?.id || "");
    setCategory(coupon.categoryId || coupon.category?.id || "");
    setCouponCode(coupon.couponCode || "");
    setRedemptionLimit(coupon.redemptionLimit ? String(coupon.redemptionLimit) : "");
    setExpires(coupon.expiresAt ? new Date(coupon.expiresAt).toISOString().slice(0, 10) : "");

    const freqMapRev: Record<string, string> = {
      ONE_TIME: "One-time use",
      DAILY: "Daily",
      WEEKLY: "Weekly",
      UNLIMITED: "Unlimited",
    };
    setFrequency(coupon.redemptionFrequency ? freqMapRev[coupon.redemptionFrequency] || "One-time use" : "One-time use");
    setDiscussion(coupon.discussion || "");
    setTerms(coupon.terms || "");
    setLogoFile(null);
    setLogoPreview(coupon.imageUrl || null);
    setIsModalOpen(true);
  }

  async function handleToggleStatus(coupon: CouponItem) {
    setOpenActionId(null);
    const newStatus = coupon.status === "ACTIVE" ? "DRAFT" : "ACTIVE";
    updateCouponMutation.mutate(
      { id: coupon.id, payload: { status: newStatus } },
      {
        onSuccess: () => {
          showToast(`${coupon.title} ${newStatus === "ACTIVE" ? "published" : "unpublished"}`);
        },
        onError: (error) => {
          console.error("Failed to toggle status:", error);
          showToast(getErrorMessage(error, "Failed to update coupon status"));
        },
      },
    );
  }

  async function handleDeleteCoupon(coupon: CouponItem) {
    setOpenActionId(null);
    if (!confirm(`Are you sure you want to delete ${coupon.title}?`)) return;
    deleteCouponMutation.mutate(coupon.id, {
      onSuccess: () => {
        showToast(`Deleted ${coupon.title}`);
      },
      onError: (error) => {
        console.error("Failed to delete coupon:", error);
        showToast(getErrorMessage(error, "Failed to delete coupon"));
      },
    });
  }

  function formatDate(date?: string | null) {
    if (!date) return "No expiry";
    try {
      return new Date(date).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return date;
    }
  }

  function getStatusLabel(status: string) {
    if (status === "ACTIVE") return "Published";
    if (status === "EXPIRED") return "Expired";
    return "Draft";
  }

  function getExportRows() {
    return filteredCoupons.map((coupon) => ({
      Offer: coupon.title,
      Business: coupon.merchant?.name || "Unknown",
      Category: coupon.category?.name || "General",
      "Start Date": formatDate(coupon.createdAt || coupon.startsAt),
      "End Date": formatDate(coupon.expiresAt),
      Views: coupon.views || 0,
      Likes: coupon.likes || 0,
      Redemptions: coupon.redemptions || 0,
      Status: getStatusLabel(coupon.status),
    }));
  }

  function getExportFileName(extension: string) {
    const merchantName =
      merchantFilter === "All merchants" ? "all-merchants" : merchantFilter;
    const safeMerchantName = merchantName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const dateStamp = new Date().toISOString().slice(0, 10);
    return `coupon-report-${safeMerchantName}-${dateStamp}.${extension}`;
  }

  function downloadBlob(blob: Blob, fileName: string) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  function exportCsv() {
    const rows = getExportRows();
    const headers = Object.keys(rows[0] ?? {
      Offer: "",
      Business: "",
      Category: "",
      "Start Date": "",
      "End Date": "",
      Views: "",
      Likes: "",
      Redemptions: "",
      Status: "",
    });
    const escapeCell = (value: string | number) => {
      const cell = String(value);
      return /[",\n]/.test(cell) ? `"${cell.replaceAll('"', '""')}"` : cell;
    };
    const csv = [
      headers.join(","),
      ...rows.map((row) =>
        headers.map((header) => escapeCell(row[header as keyof typeof row])).join(",")
      ),
    ].join("\n");

    downloadBlob(
      new Blob([csv], { type: "text/csv;charset=utf-8" }),
      getExportFileName("csv")
    );
  }

  async function exportExcel() {
    const XLSX = await import("xlsx");
    const worksheet = XLSX.utils.json_to_sheet(getExportRows());
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Coupon Report");
    XLSX.writeFile(workbook, getExportFileName("xlsx"));
  }

  async function exportPdf() {
    const [{ jsPDF }, autoTableModule] = await Promise.all([
      import("jspdf"),
      import("jspdf-autotable"),
    ]);
    const doc = new jsPDF({ orientation: "landscape" });
    const rows = getExportRows();
    const headers = Object.keys(rows[0] ?? {
      Offer: "",
      Business: "",
      Category: "",
      "Start Date": "",
      "End Date": "",
      Views: "",
      Likes: "",
      Redemptions: "",
      Status: "",
    });

    doc.setFontSize(14);
    doc.text("Coupon Performance Report", 14, 14);
    doc.setFontSize(9);
    doc.text(`Merchant: ${merchantFilter} | Status: ${statusFilter}`, 14, 21);

    autoTableModule.default(doc, {
      head: [headers],
      body: rows.map((row) => headers.map((header) => row[header as keyof typeof row])),
      startY: 27,
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [249, 115, 22] },
    });

    doc.save(getExportFileName("pdf"));
  }

  async function handleExport(format: "CSV" | "Excel" | "PDF") {
    if (filteredCoupons.length === 0) {
      showToast("No coupon data to export");
      return;
    }

    try {
      if (format === "CSV") {
        exportCsv();
      } else if (format === "Excel") {
        await exportExcel();
      } else {
        await exportPdf();
      }

      showToast(`${format} report downloaded`);
    } catch {
      showToast(`${format} export failed`);
    }
  }

  const handleSaveCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!offer.trim()) {
      showToast("Offer Title is required");
      return;
    }

    if (!business) {
      showToast("Please select a Business");
      return;
    }

    try {
      let uploadedImageUrl = editingCoupon?.imageUrl || "";

      if (logoFile) {
        try {
          const uploadRes = await uploadImage(logoFile, "coupons");
          uploadedImageUrl = uploadRes.secureUrl || uploadRes.url;
        } catch (uploadErr) {
          console.warn("Coupon image upload failed, continuing:", uploadErr);
        }
      }

      const freqMap: Record<string, string> = {
        "One-time use": "ONE_TIME",
        Daily: "DAILY",
        Weekly: "WEEKLY",
        Unlimited: "UNLIMITED",
      };

      const payload: CouponPayload = {
        title: offer.trim(),
        description: discussion.trim() || offer.trim(),
        merchantId: business,
        categoryId: category || undefined,
        imageUrl: uploadedImageUrl || undefined,
        couponCode: couponCode.trim() || undefined,
        redemptionLimit: redemptionLimit ? parseInt(redemptionLimit, 10) : undefined,
        redemptionFrequency: freqMap[frequency] || "ONE_TIME",
        discussion: discussion.trim() || undefined,
        terms: terms.trim() || undefined,
        expiresAt: expires ? new Date(`${expires}T23:59:59.000Z`).toISOString() : undefined,
        status: "ACTIVE",
      };

      if (editingCoupon) {
        await updateCouponMutation.mutateAsync({ id: editingCoupon.id, payload });
        showToast("Coupon changes saved");
      } else {
        await createCouponMutation.mutateAsync(payload);
        showToast("Coupon created successfully");
      }

      handleCloseModal();
    } catch (err: unknown) {
      console.error("Failed to save coupon:", err);
      showToast(getErrorMessage(err, "Failed to save coupon"));
    }
  };

  const merchantOptions = [
    "All merchants",
    ...Array.from(new Set(coupons.map((c) => c.merchant?.name).filter(Boolean) as string[])),
  ];

  const filteredCoupons = coupons.filter((coupon) => {
    const merchantName = coupon.merchant?.name || "";
    const merchantMatches =
      merchantFilter === "All merchants" || merchantName === merchantFilter;

    const statusLabel = getStatusLabel(coupon.status);
    const statusMatches =
      statusFilter === "All statuses" || statusLabel === statusFilter;

    return merchantMatches && statusMatches;
  });

  const totalViews = filteredCoupons.reduce((sum, coupon) => sum + (coupon.views || 0), 0);
  const totalLikes = filteredCoupons.reduce((sum, coupon) => sum + (coupon.likes || 0), 0);
  const totalRedemptions = filteredCoupons.reduce((sum, coupon) => sum + (coupon.redemptions || 0), 0);

  return (
    <div className="w-full px-4 py-4 sm:px-6 lg:px-8 lg:py-6">
      <style jsx>{`
        .coupons-mobile-list {
          display: grid;
        }

        .coupons-desktop-table {
          display: none;
        }

        @media (min-width: 1024px) {
          .coupons-mobile-list {
            display: none;
          }

          .coupons-desktop-table {
            display: block;
          }
        }
      `}</style>
      <section className="w-full rounded-2xl border border-[#d1d5db] bg-white p-3 sm:p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h1 className="m-0 text-2xl font-normal leading-8 text-slate-900 sm:text-base sm:leading-6">
              Coupons
            </h1>
            <p className="mt-1 line-clamp-2 text-sm leading-5 text-[#475569] sm:truncate">
              Manage all coupon offers, publishing status and redemption windows
            </p>
          </div>
          <button
            className="flex h-12 w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-[#f97316] px-4 py-3 text-base leading-6 text-white transition-opacity hover:opacity-95 sm:w-auto"
            type="button"
            onClick={handleOpenNewCoupon}
          >
            <Image src={`${assetBase}imgAdd.svg`} alt="" width={24} height={24} />
            New coupon
          </button>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {[
            { label: "Total opens / views", value: totalViews.toLocaleString() },
            { label: "Total likes", value: totalLikes.toLocaleString() },
            { label: "Total redemptions", value: totalRedemptions.toLocaleString() },
          ].map((item) => (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4" key={item.label}>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                {item.label}
              </p>
              <strong className="mt-1 block text-2xl font-semibold text-slate-900">
                {item.value}
              </strong>
            </div>
          ))}
        </div>

        <div className="mt-4 flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid min-w-0 gap-1">
              <span className="text-xs font-medium text-slate-600">Merchant</span>
              <select
                className="h-10 w-full min-w-0 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none focus:border-orange-400 sm:min-w-48"
                value={merchantFilter}
                onChange={(event) => setMerchantFilter(event.target.value)}
              >
                {merchantOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid min-w-0 gap-1">
              <span className="text-xs font-medium text-slate-600">Status</span>
              <select
                className="h-10 w-full min-w-0 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none focus:border-orange-400 sm:min-w-40"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
              >
                {["All statuses", "Published", "Draft", "Expired"].map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="grid grid-cols-3 gap-2 sm:flex sm:flex-wrap">
            {(["CSV", "Excel", "PDF"] as const).map((format) => (
              <button
                className="h-10 min-w-0 rounded-lg border border-slate-200 bg-white px-2 text-xs font-medium leading-none text-slate-700 hover:bg-slate-100 sm:px-3 sm:text-sm"
                key={format}
                type="button"
                onClick={() => handleExport(format)}
              >
                <span className="hidden min-[420px]:inline">Export </span>
                {format}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex h-48 items-center justify-center text-sm text-slate-500">
            Loading coupons from server...
          </div>
        ) : filteredCoupons.length === 0 ? (
          <div className="flex h-48 flex-col items-center justify-center gap-2 text-slate-500">
            <p className="text-sm">No coupons found.</p>
            <button
              onClick={handleOpenNewCoupon}
              className="text-sm font-medium text-orange-600 hover:underline"
            >
              + Create your first coupon
            </button>
          </div>
        ) : (
          <>
            <div className="coupons-mobile-list mt-4 gap-3">
              {filteredCoupons.map((coupon) => (
                <article
                  className="relative rounded-xl border border-slate-200 bg-white p-3 shadow-sm"
                  key={coupon.id}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="relative size-10 shrink-0 overflow-hidden rounded bg-slate-100">
                        <Image
                          className="object-cover"
                          src={coupon.imageUrl || `${assetBase}imgLocationAvatar.png`}
                          alt=""
                          fill
                          sizes="40px"
                          unoptimized={!!coupon.imageUrl}
                        />
                      </span>
                      <span className="min-w-0">
                        <strong className="block text-sm font-medium leading-5 text-slate-900">
                          {coupon.title}
                        </strong>
                        <small className="mt-0.5 block truncate text-xs leading-4 text-[#475569]">
                          {coupon.merchant?.name || "Merchant"}
                        </small>
                      </span>
                    </div>
                    <div className="relative shrink-0">
                      <button
                        type="button"
                        aria-expanded={openActionId === coupon.id}
                        aria-label={`Open actions for ${coupon.title}`}
                        className="grid size-9 place-items-center rounded-lg border border-slate-300 bg-white text-lg font-bold leading-none text-[#0c4a6e] shadow-sm transition-colors hover:border-[#0c4a6e] hover:bg-sky-50"
                        onClick={() =>
                          setOpenActionId((currentId) =>
                            currentId === coupon.id ? null : coupon.id
                          )
                        }
                      >
                        ⋮
                      </button>
                      {openActionId === coupon.id && (
                        <div className="absolute right-0 top-10 z-20 w-44 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 text-sm shadow-xl">
                          <button
                            className="block w-full px-3.5 py-2 text-left text-slate-700 hover:bg-slate-50"
                            type="button"
                            onClick={() => handleEditCoupon(coupon)}
                          >
                            Edit
                          </button>
                          <button
                            className="block w-full px-3.5 py-2 text-left text-[#f97316] hover:bg-orange-50"
                            type="button"
                            onClick={() => handleToggleStatus(coupon)}
                          >
                            {coupon.status === "ACTIVE" ? "Unpublish" : "Publish"}
                          </button>
                          <button
                            className="block w-full px-3.5 py-2 text-left text-red-600 hover:bg-red-50"
                            type="button"
                            onClick={() => handleDeleteCoupon(coupon)}
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="inline-flex h-6 items-center rounded bg-[#ffedd5] px-2.5 text-xs font-medium text-[#f97316]">
                      {coupon.category?.name || "General"}
                    </span>
                    <span
                      className={
                        coupon.status === "ACTIVE"
                          ? "inline-flex h-6 items-center rounded bg-emerald-100 px-2.5 text-xs font-medium leading-5 text-[#16a34a]"
                          : coupon.status === "EXPIRED"
                          ? "inline-flex h-6 items-center rounded bg-red-100 px-2.5 text-xs font-medium leading-5 text-red-600"
                          : "inline-flex h-6 items-center rounded bg-slate-100 px-2.5 text-xs font-medium leading-5 text-slate-600"
                      }
                    >
                      {getStatusLabel(coupon.status)}
                    </span>
                  </div>

                  <div className="mt-3 grid grid-cols-3 gap-2 rounded-lg bg-slate-50 p-2 text-center">
                    <div>
                      <span className="block text-[10px] font-medium uppercase text-slate-400">
                        Views
                      </span>
                      <strong className="text-sm text-slate-900">
                        {(coupon.views || 0).toLocaleString()}
                      </strong>
                    </div>
                    <div>
                      <span className="block text-[10px] font-medium uppercase text-slate-400">
                        Likes
                      </span>
                      <strong className="text-sm text-slate-900">
                        {(coupon.likes || 0).toLocaleString()}
                      </strong>
                    </div>
                    <div>
                      <span className="block text-[10px] font-medium uppercase text-slate-400">
                        Redeemed
                      </span>
                      <strong className="text-sm text-slate-900">
                        {(coupon.redemptions || 0).toLocaleString()}
                      </strong>
                    </div>
                  </div>

                  <div className="mt-3 text-xs leading-5 text-slate-500">
                    {formatDate(coupon.createdAt || coupon.startsAt)} to {formatDate(coupon.expiresAt)}
                  </div>
                </article>
              ))}
            </div>

            <div className="coupons-desktop-table mt-4 overflow-x-auto overflow-y-visible rounded-lg border border-slate-200">
              <div className="min-w-[1120px]">
                {/* Table Header */}
                <div className="grid h-[55px] grid-cols-[minmax(250px,1.5fr)_minmax(170px,1fr)_110px_140px_90px_80px_110px_120px_70px] items-center bg-slate-100 text-sm leading-5 text-[#315576]">
                  <div className="border-r border-slate-300 px-4">Offer</div>
                  <div className="border-r border-slate-300 px-4">Business</div>
                  <div className="border-r border-slate-300 px-4">Badge</div>
                  <div className="border-r border-slate-300 px-4">Rounds</div>
                  <div className="border-r border-slate-300 px-4">Views</div>
                  <div className="border-r border-slate-300 px-4">Likes</div>
                  <div className="border-r border-slate-300 px-4">Redemptions</div>
                  <div className="border-r border-slate-300 px-4">Status</div>
                  <div className="px-4 text-center">Actions</div>
                </div>

                {/* Table Body */}
                {filteredCoupons.map((coupon) => (
                  <div
                    className="grid h-[60px] grid-cols-[minmax(250px,1.5fr)_minmax(170px,1fr)_110px_140px_90px_80px_110px_120px_70px] items-center border-b border-dashed border-slate-200 bg-white transition-colors hover:bg-slate-50/70 last:border-b-0"
                    key={coupon.id}
                  >
                    {/* Offer column */}
                    <div className="flex min-w-0 items-center gap-3 px-4 py-2">
                      <span className="relative size-8 shrink-0 overflow-hidden rounded bg-slate-100">
                        <Image
                          className="object-cover"
                          src={coupon.imageUrl || `${assetBase}imgLocationAvatar.png`}
                          alt=""
                          fill
                          sizes="32px"
                          unoptimized={!!coupon.imageUrl}
                        />
                      </span>
                      <strong className="block truncate text-sm font-normal leading-5 text-slate-900">
                        {coupon.title}
                      </strong>
                    </div>

                    {/* Business column */}
                    <p className="truncate px-4 text-sm leading-5 text-slate-900">
                      {coupon.merchant?.name || "Merchant"}
                    </p>

                    {/* Badge column */}
                    <div className="px-4">
                      <span className="inline-flex h-6 items-center rounded bg-[#ffedd5] px-2.5 text-xs font-medium text-[#f97316]">
                        {coupon.category?.name || "General"}
                      </span>
                    </div>

                    {/* Rounds column */}
                    <div className="px-4 leading-tight">
                      <p className="m-0 text-sm font-normal leading-5 text-slate-900">
                        {formatDate(coupon.createdAt || coupon.startsAt)}
                      </p>
                      <p className="m-0 text-xs leading-4 text-[#475569]">
                        Exp-{formatDate(coupon.expiresAt)}
                      </p>
                    </div>

                    <p className="px-4 text-sm text-slate-900">{(coupon.views || 0).toLocaleString()}</p>
                    <p className="px-4 text-sm text-slate-900">{(coupon.likes || 0).toLocaleString()}</p>
                    <p className="px-4 text-sm text-slate-900">{(coupon.redemptions || 0).toLocaleString()}</p>

                    {/* Status column */}
                    <div className="px-4">
                      <span
                        className={
                          coupon.status === "ACTIVE"
                            ? "inline-flex h-6 items-center rounded bg-emerald-100 px-2.5 text-xs font-medium leading-5 text-[#16a34a]"
                            : coupon.status === "EXPIRED"
                            ? "inline-flex h-6 items-center rounded bg-red-100 px-2.5 text-xs font-medium leading-5 text-red-600"
                            : "inline-flex h-6 items-center rounded bg-slate-100 px-2.5 text-xs font-medium leading-5 text-slate-600"
                        }
                      >
                        {getStatusLabel(coupon.status)}
                      </span>
                    </div>

                    {/* Actions column */}
                    <div className="relative flex justify-center px-4">
                      <button
                        type="button"
                        aria-expanded={openActionId === coupon.id}
                        aria-label={`Open actions for ${coupon.title}`}
                        className="grid size-9 place-items-center rounded-lg border border-slate-300 bg-white text-lg font-bold leading-none text-[#0c4a6e] shadow-sm transition-colors hover:border-[#0c4a6e] hover:bg-sky-50"
                        onClick={() =>
                          setOpenActionId((currentId) =>
                            currentId === coupon.id ? null : coupon.id
                          )
                        }
                      >
                        ⋮
                      </button>
                      {openActionId === coupon.id && (
                        <div className="absolute right-4 top-10 z-20 w-44 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 text-sm shadow-xl">
                          <button
                            className="block w-full px-3.5 py-2 text-left text-slate-700 hover:bg-slate-50"
                            type="button"
                            onClick={() => handleEditCoupon(coupon)}
                          >
                            Edit
                          </button>
                          <button
                            className="block w-full px-3.5 py-2 text-left text-[#f97316] hover:bg-orange-50"
                            type="button"
                            onClick={() => handleToggleStatus(coupon)}
                          >
                            {coupon.status === "ACTIVE" ? "Unpublish" : "Publish"}
                          </button>
                          <button
                            className="block w-full px-3.5 py-2 text-left text-red-600 hover:bg-red-50"
                            type="button"
                            onClick={() => handleDeleteCoupon(coupon)}
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </section>

      {/* Reusable Centered Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingCoupon ? "Edit coupon" : "New coupon"}
        maxWidth="max-w-[560px]"
      >
        <form onSubmit={handleSaveCoupon} className="flex flex-col gap-4">
          {/* Top Logo Upload Card */}
          <div className="flex items-center gap-4 rounded-2xl border border-slate-200/80 bg-white p-3.5">
            <span className="relative size-16 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
              <Image
                src={logoPreview ?? `${assetBase}imgLocationAvatar.png`}
                alt="Upload preview"
                fill
                sizes="64px"
                className="object-cover"
                unoptimized={!!logoPreview}
              />
            </span>
            <label
              className="flex h-10 cursor-pointer items-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-800 shadow-sm transition-colors hover:bg-slate-50"
              htmlFor="coupon-logo-upload"
            >
              Upload Coupon Image
              <input
                className="sr-only"
                id="coupon-logo-upload"
                type="file"
                accept="image/*"
                onChange={handleLogoChange}
              />
            </label>
          </div>

          {/* Form Fields Card */}
          <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-4">
            {/* Row 1: Business & Offer Title */}
            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
              <label className="grid gap-1">
                <span className="text-xs font-semibold text-slate-800">Business *</span>
                <div className="relative">
                  <select
                    required
                    value={business}
                    onChange={(e) => setBusiness(e.target.value)}
                    className="h-10 w-full appearance-none rounded-xl border border-slate-200/70 bg-[#f8fafc] px-3.5 pr-8 text-sm text-slate-800 outline-none transition-colors focus:border-slate-400 focus:bg-white"
                  >
                    <option value="">Select Business</option>
                    {merchants.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                    <svg className="size-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </span>
                </div>
              </label>

              <label className="grid gap-1">
                <span className="text-xs font-semibold text-slate-800">Offer Title *</span>
                <input
                  required
                  value={offer}
                  onChange={(e) => setOffer(e.target.value)}
                  placeholder="e.g. 20% off all dinner items"
                  className="h-10 w-full rounded-xl border border-slate-200/70 bg-[#f8fafc] px-3.5 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition-colors focus:border-slate-400 focus:bg-white"
                />
              </label>
            </div>

            {/* Row 2: Categories & Coupon Code / link */}
            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
              <label className="grid gap-1">
                <span className="text-xs font-semibold text-slate-800">Category</span>
                <div className="relative">
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="h-10 w-full appearance-none rounded-xl border border-slate-200/70 bg-[#f8fafc] px-3.5 pr-8 text-sm text-slate-800 outline-none transition-colors focus:border-slate-400 focus:bg-white"
                  >
                    <option value="">Select Category</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                    <svg className="size-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </span>
                </div>
              </label>

              <label className="grid gap-1">
                <span className="text-xs font-semibold text-slate-800">Coupon Code / link</span>
                <input
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  placeholder="e.g. SAVE20"
                  className="h-10 w-full rounded-xl border border-slate-200/70 bg-[#f8fafc] px-3.5 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition-colors focus:border-slate-400 focus:bg-white"
                />
              </label>
            </div>

            {/* Row 3: Redemption Limit & Expires */}
            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
              <label className="grid gap-1">
                <span className="text-xs font-semibold text-slate-800">Redemption Limit</span>
                <input
                  type="number"
                  value={redemptionLimit}
                  onChange={(e) => setRedemptionLimit(e.target.value)}
                  placeholder="e.g. 50"
                  className="h-10 w-full rounded-xl border border-slate-200/70 bg-[#f8fafc] px-3.5 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition-colors focus:border-slate-400 focus:bg-white"
                />
              </label>

              <label className="grid gap-1">
                <span className="text-xs font-semibold text-slate-800">Expires</span>
                <div className="relative">
                  <input
                    type="date"
                    value={expires}
                    onChange={(e) => setExpires(e.target.value)}
                    className="h-10 w-full rounded-xl border border-slate-200/70 bg-[#f8fafc] px-3.5 text-sm text-slate-800 outline-none transition-colors focus:border-slate-400 focus:bg-white"
                  />
                </div>
              </label>
            </div>

            {/* Row 4: Redemption Frequency* */}
            <label className="grid gap-1">
              <span className="text-xs font-semibold text-slate-800">Redemption Frequency *</span>
              <div className="relative">
                <select
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value)}
                  className="h-10 w-full appearance-none rounded-xl border border-slate-200/70 bg-[#f8fafc] px-3.5 pr-8 text-sm text-slate-800 outline-none transition-colors focus:border-slate-400 focus:bg-white"
                >
                  <option value="One-time use">One-time use</option>
                  <option value="Daily">Daily</option>
                  <option value="Weekly">Weekly</option>
                  <option value="Unlimited">Unlimited</option>
                </select>
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <svg className="size-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </span>
              </div>
            </label>

            {/* Row 5: Discussion */}
            <label className="grid gap-1">
              <span className="text-xs font-semibold text-slate-800">Discussion / Short Description</span>
              <input
                value={discussion}
                onChange={(e) => setDiscussion(e.target.value)}
                placeholder="Add a short caption or description"
                className="h-10 w-full rounded-xl border border-slate-200/70 bg-[#f8fafc] px-3.5 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition-colors focus:border-slate-400 focus:bg-white"
              />
            </label>

            {/* Row 6: Terms and conditions */}
            <label className="grid gap-1">
              <span className="text-xs font-semibold text-slate-800">Terms and conditions</span>
              <input
                value={terms}
                onChange={(e) => setTerms(e.target.value)}
                placeholder="e.g. Valid on dine-in only. Cannot combine with other offers."
                className="h-10 w-full rounded-xl border border-slate-200/70 bg-[#f8fafc] px-3.5 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition-colors focus:border-slate-400 focus:bg-white"
              />
            </label>
          </div>

          {/* Action Buttons */}
          <div className="flex w-full items-center gap-3 pt-1">
            <button
              type="button"
              onClick={handleCloseModal}
              disabled={saving}
              className="h-11 flex-1 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-800 transition-colors hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="h-11 flex-1 rounded-xl bg-[#f97316] text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-95 disabled:opacity-50"
            >
              {saving ? "Saving..." : editingCoupon ? "Save changes" : "Save coupon"}
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
