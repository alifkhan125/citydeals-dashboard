"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { AxiosError } from "axios";
import Modal from "@/components/Modal";
import DeleteWarningModal from "@/components/DeleteWarningModal";
import CsvImportModal from "@/components/CsvImportModal";
import { toast } from "@/components/Toast";
import { uploadImage } from "@/api/upload";
import { couponsApi, type CouponItem, type CouponPayload } from "@/api/coupons";
import { downloadCouponReport } from "@/lib/couponReportPdf";
import {
  useCouponCategories,
  useCouponAreas,
  useCouponMerchants,
  useAdminCoupons,
  useBulkCouponStatus,
  useBulkDeleteCoupons,
  useDuplicateCoupon,
  useCreateCoupon,
  useDeleteCoupon,
  useUpdateCoupon,
  useNotifyNearbyCoupon,
} from "@/hooks/useCoupons";

const assetBase = "/assets/dashboard/";

export default function CouponsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [areaFilter, setAreaFilter] = useState("ALL");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [merchantFilter, setMerchantFilter] = useState("All merchants");
  const [statusFilter, setStatusFilter] = useState("All statuses");
  const [audienceFilter, setAudienceFilter] = useState("ALL");
  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedSearch(searchQuery), 350);
    return () => window.clearTimeout(timeout);
  }, [searchQuery]);
  const { data: merchants = [], isLoading: isMerchantsLoading } = useCouponMerchants();
  const { data: areas = [], isLoading: isAreasLoading } = useCouponAreas();
  const { data: categories = [], isLoading: isCategoriesLoading } = useCouponCategories();
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const { data: couponPage, isLoading: isCouponsLoading } = useAdminCoupons({
    page: currentPage,
    limit: pageSize,
    search: debouncedSearch.trim() || undefined,
    status: statusFilter === "Published" ? "ACTIVE" : statusFilter === "Archived" ? "ARCHIVED" : statusFilter === "Expired" ? "EXPIRED" : undefined,
    merchantId: merchantFilter === "All merchants" ? undefined : merchants.find((item) => item.name === merchantFilter)?.id,
    categoryId: categoryFilter === "ALL" ? undefined : categoryFilter,
    areaId: areaFilter === "ALL" ? undefined : areaFilter,
    audience: audienceFilter === "ALL" ? undefined : audienceFilter,
  });
  const coupons = couponPage?.items ?? [];
  const createCouponMutation = useCreateCoupon();
  const updateCouponMutation = useUpdateCoupon();
  const deleteCouponMutation = useDeleteCoupon();
  const bulkStatusMutation = useBulkCouponStatus();
  const bulkDeleteMutation = useBulkDeleteCoupons();
  const duplicateCouponMutation = useDuplicateCoupon();
  const notifyCouponMutation = useNotifyNearbyCoupon();
  const loading = isCouponsLoading || isMerchantsLoading || isCategoriesLoading || isAreasLoading;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const saving = isSubmitting || createCouponMutation.isPending || updateCouponMutation.isPending;
  const saveInFlightRef = useRef(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [editingCoupon, setEditingCoupon] = useState<CouponItem | null>(null);
  const [couponToDelete, setCouponToDelete] = useState<CouponItem | null>(null);
  const [couponToNotify, setCouponToNotify] = useState<CouponItem | null>(null);
  const [openActionId, setOpenActionId] = useState<string | null>(null);
  const [reportExportingId, setReportExportingId] = useState<string | null>(null);
  const [actionMenuPosition, setActionMenuPosition] = useState({ top: 0, left: 0 });
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [selectedCouponIds, setSelectedCouponIds] = useState<string[]>([]);
  const [isImportOpen, setIsImportOpen] = useState(false);

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
  const [audience, setAudience] = useState<"ALL_USERS" | "BIRTHDAY_USERS_ONLY" | "ALL_USERS_AND_BIRTHDAY_GIFT">("ALL_USERS");

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

  async function exportCouponDetailPdf(coupon: CouponItem) {
    try {
      setOpenActionId(null);
      setReportExportingId(coupon.id);
      const report = await couponsApi.report(coupon.id);
      await downloadCouponReport(report);
      toast.success(`${coupon.title} report downloaded`, { title: "PDF ready" });
    } catch (error) {
      toast.error(getErrorMessage(error, "Could not generate coupon report"), { title: "Export failed" });
    } finally {
      setReportExportingId(null);
    }
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

  async function handleDuplicateCoupon(coupon: CouponItem) {
    try {
      await duplicateCouponMutation.mutateAsync(coupon.id);
      toast.success(`${coupon.title} duplicated as an archived draft`, { title: "Coupon duplicated" });
    } catch (error) {
      toast.error(getErrorMessage(error, "Could not duplicate coupon"), { title: "Duplicate failed" });
    }
  }

  function toggleActionMenu(event: React.MouseEvent<HTMLButtonElement>, id: string) {
    if (openActionId === id) {
      setOpenActionId(null);
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();
    const menuHeight = 210;
    const menuWidth = 176;
    const openBelow = window.innerHeight - rect.bottom >= menuHeight || rect.top < menuHeight;
    const top = openBelow ? rect.bottom + 8 : rect.top - menuHeight - 8;
    const left = Math.max(8, Math.min(rect.right - menuWidth, window.innerWidth - menuWidth - 8));

    setActionMenuPosition({ top, left });
    setOpenActionId(id);
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
    setAudience("ALL_USERS");
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
      HOURLY: "Hourly",
      DAILY: "Daily",
      WEEKLY: "Weekly",
      UNLIMITED: "Unlimited",
    };
    setFrequency(coupon.redemptionFrequency ? freqMapRev[coupon.redemptionFrequency] || "One-time use" : "One-time use");
    setDiscussion(coupon.discussion || "");
    setTerms(coupon.terms || "");
    setAudience(coupon.audience || "ALL_USERS");
    setLogoFile(null);
    setLogoPreview(coupon.imageUrl || null);
    setIsModalOpen(true);
  }

  async function handleToggleStatus(coupon: CouponItem) {
    setOpenActionId(null);
    if (updateCouponMutation.isPending || deleteCouponMutation.isPending) return;
    const newStatus = coupon.status === "ACTIVE" ? "ARCHIVED" : "ACTIVE";
    try {
      await updateCouponMutation.mutateAsync({ id: coupon.id, payload: { status: newStatus } });
      toast.success(
        `${coupon.title} ${newStatus === "ACTIVE" ? "published" : "archived"}.`,
        { title: newStatus === "ACTIVE" ? "Coupon Published" : "Coupon Archived" },
      );
    } catch (error) {
      console.error("Failed to toggle status:", error);
      toast.error(getErrorMessage(error, "Failed to update coupon status"), {
        title: "Status Update Failed",
      });
    }
  }

  function handleDeleteCoupon(coupon: CouponItem) {
    setOpenActionId(null);
    setCouponToDelete(coupon);
  }

  function confirmDeleteCoupon() {
    if (!couponToDelete) return;
    if (deleteCouponMutation.isPending || saving) return;
    const coupon = couponToDelete;
    deleteCouponMutation.mutateAsync(coupon.id)
      .then(() => {
        toast.success(`Deleted ${coupon.title}`, { title: "Coupon Deleted" });
        setCouponToDelete(null);
      })
      .catch((error) => {
        console.error("Failed to delete coupon:", error);
        toast.error(getErrorMessage(error, "Failed to delete coupon"), { title: "Coupon Delete Failed" });
        setCouponToDelete(null);
      });
  }

  function handleNotifyNearby(coupon: CouponItem) {
    setOpenActionId(null);
    setCouponToNotify(coupon);
  }

  async function confirmNotifyNearby() {
    if (!couponToNotify) return;
    notifyCouponMutation.mutate(couponToNotify.id, {
      onSuccess: (data: any) => {
        showToast(data?.message || `Notification sent to nearby users`);
        setCouponToNotify(null);
      },
      onError: (error) => {
        console.error("Failed to send notification:", error);
        showToast(getErrorMessage(error, "Failed to send notification"));
        setCouponToNotify(null);
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
    return "Archived";
  }

  function getExportRows() {
    return coupons.map((coupon) => ({
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

  async function handleExport(format: "CSV" | "PDF") {
    if (coupons.length === 0) {
      showToast("No coupon data to export");
      return;
    }

    try {
      if (format === "CSV") {
        exportCsv();
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
    if (saveInFlightRef.current || saving || deleteCouponMutation.isPending) return;
    if (!offer.trim()) {
      showToast("Offer Title is required");
      return;
    }

    if (!business) {
      showToast("Please select a Business");
      return;
    }

    // React state updates are asynchronous; use an immediate ref guard so a
    // rapid double-click cannot create two identical coupons.
    saveInFlightRef.current = true;
    setIsSubmitting(true);
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
        Hourly: "HOURLY",
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
        // Keep archived coupons out of the app until an admin explicitly publishes them.
        status: editingCoupon?.status || "ACTIVE",
        audience,
      };

      if (editingCoupon) {
        await updateCouponMutation.mutateAsync({ id: editingCoupon.id, payload });
        toast.success("Coupon changes saved", { title: "Coupon Updated" });
      } else {
        await createCouponMutation.mutateAsync(payload);
        toast.success("Coupon created successfully", { title: "Coupon Created" });
      }

      handleCloseModal();
    } catch (err: unknown) {
      console.error("Failed to save coupon:", err);
      toast.error(getErrorMessage(err, "Failed to save coupon"), { title: "Coupon Save Failed" });
    } finally {
      saveInFlightRef.current = false;
      setIsSubmitting(false);
    }
  };

  const merchantOptions = ["All merchants", ...merchants.map((merchant) => merchant.name)];
  const totalPages = couponPage?.meta.totalPages ?? 1;
  const safePage = Math.min(currentPage, totalPages);
  const paginatedCoupons = coupons;
  const totalResults = couponPage?.meta.total ?? 0;
  const totalViews = coupons.reduce((sum, coupon) => sum + (coupon.views || 0), 0);
  const totalLikes = coupons.reduce((sum, coupon) => sum + (coupon.likes || 0), 0);
  const totalRedemptions = coupons.reduce((sum, coupon) => sum + (coupon.redemptions || 0), 0);

  useEffect(() => {
    setCurrentPage(1);
    setSelectedCouponIds([]);
  }, [merchantFilter, statusFilter, areaFilter, categoryFilter, audienceFilter, debouncedSearch, pageSize]);

  const toggleCouponSelection = (id: string) => {
    setSelectedCouponIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  };

  const allVisibleSelected = coupons.length > 0 && coupons.every((coupon) => selectedCouponIds.includes(coupon.id));
  const toggleVisibleSelection = () => {
    setSelectedCouponIds((current) => allVisibleSelected
      ? current.filter((id) => !coupons.some((coupon) => coupon.id === id))
      : Array.from(new Set([...current, ...coupons.map((coupon) => coupon.id)])));
  };
  async function selectAllFilteredCoupons() {
    try {
      const result = await couponsApi.adminIds({
        search: debouncedSearch.trim() || undefined,
        status: statusFilter === "Published" ? "ACTIVE" : statusFilter === "Archived" ? "ARCHIVED" : statusFilter === "Expired" ? "EXPIRED" : undefined,
        merchantId: merchantFilter === "All merchants" ? undefined : merchants.find((item) => item.name === merchantFilter)?.id,
        categoryId: categoryFilter === "ALL" ? undefined : categoryFilter,
        areaId: areaFilter === "ALL" ? undefined : areaFilter,
        audience: audienceFilter === "ALL" ? undefined : audienceFilter,
      });
      setSelectedCouponIds(result.ids);
    } catch (error) {
      toast.error(getErrorMessage(error, "Could not select filtered coupons"), { title: "Selection failed" });
    }
  }

  async function runBulkStatus(status: "ACTIVE" | "ARCHIVED") {
    if (selectedCouponIds.length === 0) return;
    try {
      await bulkStatusMutation.mutateAsync({ ids: selectedCouponIds, status });
      toast.success(`${selectedCouponIds.length} coupons updated`, { title: "Bulk update complete" });
      setSelectedCouponIds([]);
    } catch (error) {
      toast.error(getErrorMessage(error, "Bulk update failed"), { title: "Bulk update failed" });
    }
  }

  async function runBulkDelete() {
    if (selectedCouponIds.length === 0 || !window.confirm(`Delete ${selectedCouponIds.length} selected coupons?`)) return;
    try {
      await bulkDeleteMutation.mutateAsync(selectedCouponIds);
      toast.success(`${selectedCouponIds.length} coupons deleted`, { title: "Bulk delete complete" });
      setSelectedCouponIds([]);
    } catch (error) {
      toast.error(getErrorMessage(error, "Bulk delete failed"), { title: "Bulk delete failed" });
    }
  }

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
      <section className="w-full rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5 lg:p-6">
        <div className="flex flex-col gap-4 border-b border-slate-100 pb-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h1 className="m-0 text-3xl font-semibold leading-9 tracking-tight text-slate-950">
              Coupons
            </h1>
            <p className="mt-1 text-sm leading-5 text-slate-500">
              Manage all coupon offers, publishing status and redemption windows
            </p>
          </div>
          <div className="flex w-full flex-wrap items-center gap-3 sm:w-auto">
          <button
            className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-[#f97316] px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-600 sm:flex-none"
            type="button"
            onClick={handleOpenNewCoupon}
          >
            <Image src={`${assetBase}imgAdd.svg`} alt="" width={24} height={24} />
            New coupon
          </button>
          <button type="button" onClick={() => setIsImportOpen(true)} className="h-12 flex-1 rounded-xl border border-orange-300 bg-white px-5 text-sm font-semibold text-orange-700 transition hover:bg-orange-50 sm:flex-none">Import CSV</button>
          </div>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {[
            { label: "Total opens / views", value: totalViews.toLocaleString() },
            { label: "Total likes", value: totalLikes.toLocaleString() },
            { label: "Total redemptions", value: totalRedemptions.toLocaleString() },
          ].map((item) => (
            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-5" key={item.label}>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                {item.label}
              </p>
              <strong className="mt-2 block text-3xl font-bold tracking-tight text-slate-950">
                {item.value}
              </strong>
            </div>
          ))}
        </div>

        <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
          <label className="grid w-full min-w-0 gap-1.5">
              <span className="text-xs font-semibold text-slate-600">Search</span>
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search title, description, code or business..."
                className="h-11 rounded-xl border border-slate-200 bg-white px-3.5 text-sm outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
              />
          </label>
          <div className="mt-4 grid w-full gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            <label className="grid min-w-0 gap-1">
              <span className="text-xs font-semibold text-slate-600">Merchant</span>
              <select
                 className="h-11 w-full min-w-0 rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-800 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                value={merchantFilter}
                onChange={(event) => setMerchantFilter(event.target.value)}
              >
                {merchantOptions.map((option, optionIndex) => (
                  <option key={`${option}-${optionIndex}`} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid min-w-0 gap-1">
              <span className="text-xs font-semibold text-slate-600">Status</span>
              <select
                 className="h-11 w-full min-w-0 rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-800 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
              >
                {["All statuses", "Published", "Archived", "Expired"].map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid min-w-0 gap-1">
              <span className="text-xs font-semibold text-slate-600">Area</span>
              <select className="h-11 rounded-xl border border-slate-200 bg-white px-3.5 text-sm outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100" value={areaFilter} onChange={(event) => setAreaFilter(event.target.value)}>
                <option value="ALL">All areas</option>
                {areas.map((area) => <option key={area.id} value={area.id}>{area.name}</option>)}
              </select>
            </label>
            <label className="grid min-w-0 gap-1">
              <span className="text-xs font-semibold text-slate-600">Category</span>
              <select className="h-11 rounded-xl border border-slate-200 bg-white px-3.5 text-sm outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100" value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
                <option value="ALL">All categories</option>
                {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
              </select>
            </label>
            <label className="grid min-w-0 gap-1">
              <span className="text-xs font-semibold text-slate-600">Audience</span>
              <select className="h-11 rounded-xl border border-slate-200 bg-white px-3.5 text-sm outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100" value={audienceFilter} onChange={(event) => setAudienceFilter(event.target.value)}>
                <option value="ALL">All audiences</option>
                <option value="ALL_USERS">All users</option>
                <option value="BIRTHDAY_USERS_ONLY">Birthday users only</option>
                <option value="ALL_USERS_AND_BIRTHDAY_GIFT">All + birthday gift</option>
              </select>
            </label>
          </div>
          <div className="flex flex-wrap justify-end gap-2 border-t border-slate-200 pt-3">
            {(["CSV", "PDF"] as const).map((format) => (
              <button
                 className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium leading-none text-slate-700 transition hover:border-orange-300 hover:bg-orange-50 hover:text-orange-700"
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

        {selectedCouponIds.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl border border-orange-200 bg-orange-50 p-3">
            <span className="mr-2 text-sm font-semibold text-orange-800">{selectedCouponIds.length} selected</span>
            <button type="button" onClick={() => runBulkStatus("ACTIVE")} disabled={bulkStatusMutation.isPending} className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">Publish</button>
            <button type="button" onClick={() => runBulkStatus("ARCHIVED")} disabled={bulkStatusMutation.isPending} className="rounded-lg bg-slate-700 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">Archive</button>
            <button type="button" onClick={runBulkDelete} disabled={bulkDeleteMutation.isPending} className="rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">Delete</button>
            <button type="button" onClick={() => setSelectedCouponIds([])} className="rounded-lg border border-orange-300 bg-white px-3 py-2 text-xs font-semibold text-orange-800">Clear</button>
          </div>
        )}
        <button type="button" onClick={selectAllFilteredCoupons} className="mt-3 text-left text-xs font-semibold text-orange-700 underline">Select all filtered coupons</button>

        {loading ? (
          <div className="flex h-48 items-center justify-center text-sm text-slate-500">
            Loading coupons from server...
          </div>
        ) : coupons.length === 0 ? (
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
              <label className="flex items-center gap-2 text-xs font-medium text-slate-600">
                <input type="checkbox" checked={allVisibleSelected} onChange={toggleVisibleSelection} />
                Select current page
              </label>
              {paginatedCoupons.map((coupon) => (
                <article
                  className="relative rounded-xl border border-slate-200 bg-white p-3 shadow-sm"
                  key={coupon.id}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <input type="checkbox" checked={selectedCouponIds.includes(coupon.id)} onChange={() => toggleCouponSelection(coupon.id)} aria-label={`Select ${coupon.title}`} />
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
                        onClick={(event) => toggleActionMenu(event, coupon.id)}
                      >
                        ⋮
                      </button>
                      {openActionId === coupon.id && (
                        <div className="fixed z-50 w-44 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 text-sm shadow-xl" style={actionMenuPosition}>
                          <button
                            className="block w-full px-3.5 py-2 text-left text-slate-700 hover:bg-slate-50"
                            type="button"
                            onClick={() => handleEditCoupon(coupon)}
                          >
                            Edit
                          </button>
                          <button className="block w-full px-3.5 py-2 text-left text-slate-700 hover:bg-slate-50" type="button" onClick={() => handleDuplicateCoupon(coupon)} disabled={duplicateCouponMutation.isPending}>Duplicate</button>
                          <button
                            className="block w-full px-3.5 py-2 text-left font-medium text-[#0c4a6e] hover:bg-sky-50 disabled:opacity-50"
                            type="button"
                            disabled={reportExportingId === coupon.id}
                            onClick={() => exportCouponDetailPdf(coupon)}
                          >
                            {reportExportingId === coupon.id ? "Preparing PDF..." : "Export full PDF"}
                          </button>
                          <button
                            className="block w-full px-3.5 py-2 text-left text-[#f97316] hover:bg-orange-50"
                            type="button"
                            onClick={() => handleToggleStatus(coupon)}
                          >
                            {coupon.status === "ACTIVE" ? "Archive" : "Publish"}
                          </button>
                          <button
                            className="block w-full px-3.5 py-2 text-left text-blue-600 hover:bg-blue-50"
                            type="button"
                            onClick={() => handleNotifyNearby(coupon)}
                          >
                            Notify Nearby
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
                <div className="grid h-[55px] grid-cols-[42px_minmax(250px,1.5fr)_minmax(170px,1fr)_110px_140px_90px_80px_110px_120px_70px] items-center bg-slate-100 text-sm leading-5 text-[#315576]">
                  <div className="border-r border-slate-300 px-3"><input type="checkbox" checked={allVisibleSelected} onChange={toggleVisibleSelection} aria-label="Select current page" /></div>
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
                {paginatedCoupons.map((coupon) => (
                  <div
                    className="grid h-[60px] grid-cols-[42px_minmax(250px,1.5fr)_minmax(170px,1fr)_110px_140px_90px_80px_110px_120px_70px] items-center border-b border-dashed border-slate-200 bg-white transition-colors hover:bg-slate-50/70 last:border-b-0"
                    key={coupon.id}
                  >
                    <div className="px-3"><input type="checkbox" checked={selectedCouponIds.includes(coupon.id)} onChange={() => toggleCouponSelection(coupon.id)} aria-label={`Select ${coupon.title}`} /></div>

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
                      {coupon.audience && coupon.audience !== "ALL_USERS" && <span className="rounded bg-orange-50 px-1.5 py-0.5 text-[10px] font-semibold text-orange-700">{coupon.audience === "BIRTHDAY_USERS_ONLY" ? "Birthday only" : "Birthday gift"}</span>}
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
                        onClick={(event) => toggleActionMenu(event, coupon.id)}
                      >
                        ⋮
                      </button>
                      {openActionId === coupon.id && (
                        <div className="fixed z-50 w-44 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 text-sm shadow-xl" style={actionMenuPosition}>
                          <button
                            className="block w-full px-3.5 py-2 text-left text-slate-700 hover:bg-slate-50"
                            type="button"
                            onClick={() => handleEditCoupon(coupon)}
                          >
                            Edit
                          </button>
                        <button className="block w-full px-3.5 py-2 text-left text-slate-700 hover:bg-slate-50" type="button" onClick={() => handleDuplicateCoupon(coupon)} disabled={duplicateCouponMutation.isPending}>Duplicate</button>
                          <button
                            className="block w-full px-3.5 py-2 text-left font-medium text-[#0c4a6e] hover:bg-sky-50 disabled:opacity-50"
                            type="button"
                            disabled={reportExportingId === coupon.id}
                            onClick={() => exportCouponDetailPdf(coupon)}
                          >
                            {reportExportingId === coupon.id ? "Preparing PDF..." : "Export full PDF"}
                          </button>
                          <button
                            className="block w-full px-3.5 py-2 text-left text-[#f97316] hover:bg-orange-50"
                            type="button"
                            onClick={() => handleToggleStatus(coupon)}
                          >
                            {coupon.status === "ACTIVE" ? "Archive" : "Publish"}
                          </button>
                          <button
                            className="block w-full px-3.5 py-2 text-left text-blue-600 hover:bg-blue-50"
                            type="button"
                            onClick={() => handleNotifyNearby(coupon)}
                          >
                            Notify Nearby
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

            <div className="mt-4 flex flex-col gap-3 border-t border-slate-200 pt-4 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
              <span>
                Showing {totalResults === 0 ? 0 : (safePage - 1) * pageSize + 1}
                -{Math.min(safePage * pageSize, totalResults)} of {totalResults} coupons
              </span>
              <div className="flex items-center gap-2">
                <label htmlFor="coupon-page-size" className="whitespace-nowrap">Rows per page</label>
                <select
                  id="coupon-page-size"
                  value={pageSize}
                  onChange={(event) => setPageSize(Number(event.target.value))}
                  className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm"
                >
                  {[25, 50, 100].map((size) => <option key={size} value={size}>{size}</option>)}
                </select>
                <button type="button" disabled={safePage <= 1} onClick={() => setCurrentPage((page) => Math.max(1, page - 1))} className="rounded-lg border border-slate-300 px-3 py-1.5 disabled:cursor-not-allowed disabled:opacity-40">Previous</button>
                <span className="min-w-16 text-center">{safePage} / {totalPages}</span>
                <button type="button" disabled={safePage >= totalPages} onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))} className="rounded-lg border border-slate-300 px-3 py-1.5 disabled:cursor-not-allowed disabled:opacity-40">Next</button>
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

            {/* Audience */}
            <label className="grid gap-1">
              <span className="text-xs font-semibold text-slate-800">Who can use this coupon?</span>
              <select
                value={audience}
                onChange={(e) => setAudience(e.target.value as typeof audience)}
                className="h-10 w-full rounded-xl border border-slate-200/70 bg-[#f8fafc] px-3.5 text-sm text-slate-800 outline-none transition-colors focus:border-slate-400 focus:bg-white"
              >
                <option value="ALL_USERS">All users</option>
                <option value="BIRTHDAY_USERS_ONLY">Birthday users only</option>
                <option value="ALL_USERS_AND_BIRTHDAY_GIFT">All users + birthday gift</option>
              </select>
              <span className="text-[11px] text-slate-500">Birthday options automatically connect this coupon to the birthday notification and claim flow.</span>
            </label>

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
                  <option value="Hourly">Hourly</option>
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

      <DeleteWarningModal
        isOpen={Boolean(couponToDelete)}
        itemName={couponToDelete?.title}
        entityLabel="coupon"
        pending={deleteCouponMutation.isPending}
        onClose={() => setCouponToDelete(null)}
        onConfirm={confirmDeleteCoupon}
      />

      <CsvImportModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        title="Import Coupons CSV"
        headers={["title", "description", "business", "category", "area", "couponCode", "couponLink", "redemptionLimit", "redemptionFrequency", "startsAt", "expiresAt", "status", "terms", "discussion", "imageUrl"]}
        importCsv={couponsApi.importCsv}
        onImported={() => setIsImportOpen(false)}
      />

      {/* Confirmation Modal for Notify Nearby */}
      <Modal
        isOpen={!!couponToNotify}
        onClose={() => !notifyCouponMutation.isPending && setCouponToNotify(null)}
        title="Send Notification"
        maxWidth="max-w-[420px]"
      >
        <div className="flex flex-col gap-4">
          <p className="text-sm leading-6 text-slate-600">
            Are you sure you want to send a push notification to all users within 3km of <strong>{couponToNotify?.merchant?.name || "this merchant"}</strong> for the offer <strong>{couponToNotify?.title}</strong>?
          </p>
          <div className="mt-2 flex justify-end gap-3">
            <button
              className="rounded-lg px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100"
              onClick={() => setCouponToNotify(null)}
              disabled={notifyCouponMutation.isPending}
            >
              Cancel
            </button>
            <button
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
              onClick={confirmNotifyNearby}
              disabled={notifyCouponMutation.isPending}
            >
              {notifyCouponMutation.isPending ? "Sending..." : "Yes, Send"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
