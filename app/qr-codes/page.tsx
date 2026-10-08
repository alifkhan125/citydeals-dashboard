"use client";

import { useState, useMemo } from "react";
import { type AreaItem } from "@/api/areas";
import { useAreas, useRegenerateAllAreaQr, useRegenerateAreaQr } from "@/hooks/useAreas";

export default function QrCodesPage() {
  const { data: areas = [], isLoading: loading, refetch } = useAreas();
  const regenerateQrMutation = useRegenerateAreaQr();
  const regenerateAllQrMutation = useRegenerateAllAreaQr();
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  function showToast(text: string) {
    setToastMessage(text);
    setTimeout(() => setToastMessage(null), 3000);
  }

  function getEffectiveQrUrl(area: AreaItem): string {
    if (area.qrCodeUrl && area.qrCodeUrl.trim() !== "") {
      return area.qrCodeUrl;
    }
    // High-res QR code generator fallback
    const origin = typeof window !== "undefined" ? window.location.origin : "https://citydeals.app";
    const dirUrl = `${origin}/directory/${area.slug}`;
    return `https://api.qrserver.com/v1/create-qr-code/?size=600x600&data=${encodeURIComponent(dirUrl)}`;
  }

  function handleCopyLink(slug: string) {
    const origin = typeof window !== "undefined" ? window.location.origin : "https://citydeals.app";
    const fullLink = `${origin}/directory/${slug}`;
    navigator.clipboard.writeText(fullLink);
    setCopiedSlug(slug);
    showToast(`Copied directory link to clipboard: /directory/${slug}`);
    setTimeout(() => setCopiedSlug(null), 2000);
  }

  async function handleDownloadQr(area: AreaItem) {
    try {
      showToast(`Downloading QR for ${area.name}...`);
      const qrUrl = getEffectiveQrUrl(area);

      // Fetch blob to trigger clean download
      const response = await fetch(qrUrl);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `citydeals-qr-${area.slug}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);

      showToast(`✓ Downloaded citydeals-qr-${area.slug}.png`);
    } catch (err) {
      console.error("Failed to download QR code:", err);
      // Fallback: open in new tab
      window.open(getEffectiveQrUrl(area), "_blank");
    }
  }

  function handlePrintFlyer(area: AreaItem) {
    const qrUrl = getEffectiveQrUrl(area);
    const origin = typeof window !== "undefined" ? window.location.origin : "https://citydeals.app";
    const dirUrl = `${origin}/directory/${area.slug}`;

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      showToast("Please allow pop-ups to print store flyers");
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>CityDeals QR Display — ${area.name}</title>
          <style>
            @page { size: A4 portrait; margin: 20mm; }
            body {
              font-family: system-ui, -apple-system, sans-serif;
              text-align: center;
              margin: 0;
              padding: 40px 20px;
              color: #0f172a;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
            }
            .card {
              border: 3px solid #f97316;
              border-radius: 28px;
              padding: 40px 30px;
              max-width: 480px;
              box-shadow: 0 10px 25px -5px rgba(249, 115, 22, 0.15);
            }
            .badge {
              background: #fff7ed;
              color: #ea580c;
              padding: 6px 16px;
              border-radius: 9999px;
              font-size: 14px;
              font-weight: 700;
              letter-spacing: 1px;
              text-transform: uppercase;
              display: inline-block;
              margin-bottom: 16px;
            }
            h1 { font-size: 32px; margin: 0 0 8px 0; color: #1e293b; }
            p { font-size: 16px; color: #64748b; margin: 0 0 24px 0; }
            .qr-wrap {
              background: white;
              padding: 20px;
              border-radius: 20px;
              border: 2px dashed #cbd5e1;
              display: inline-block;
              margin-bottom: 24px;
            }
            img { width: 280px; height: 280px; display: block; }
            .cta {
              font-size: 20px;
              font-weight: 800;
              color: #f97316;
              margin-bottom: 6px;
            }
            .link {
              font-size: 13px;
              color: #94a3b8;
              font-family: monospace;
            }
          </style>
        </head>
        <body>
          <div class="card">
            <span class="badge">Official Partner Area</span>
            <h1>${area.name}</h1>
            <p>${area.city}, ${area.state} · Local City Deals</p>
            <div class="qr-wrap">
              <img src="${qrUrl}" alt="QR Code" />
            </div>
            <div class="cta">Scan to Unlock Local Deals & Discounts</div>
            <div class="link">${dirUrl}</div>
          </div>
          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  }

  async function handleRegenerateQr(area: AreaItem) {
    try {
      setRegeneratingId(area.id);
      showToast(`Regenerating QR code for ${area.name}...`);
      await regenerateQrMutation.mutateAsync(area.id);
      showToast(`✓ QR code successfully updated for ${area.name}`);
    } catch (err) {
      console.error("Failed to regenerate QR:", err);
      showToast("Failed to regenerate QR code");
    } finally {
      setRegeneratingId(null);
    }
  }

  async function handleRegenerateAll() {
    if (!confirm("Are you sure you want to regenerate QR codes for all areas?")) return;
    try {
      showToast("Regenerating all area QR codes on server...");
      const res = await regenerateAllQrMutation.mutateAsync();
      const count =
        typeof res === "object" && res && "count" in res && typeof res.count === "number"
          ? res.count
          : areas.length;
      showToast(`✓ Successfully regenerated ${count} QR codes!`);
    } catch (err) {
      console.error("Failed to regenerate all QR codes:", err);
      showToast("Failed to regenerate QR codes");
    }
  }

  const regeneratingAll = regenerateAllQrMutation.isPending;

  const filteredAreas = useMemo(() => {
    if (!searchQuery.trim()) return areas;
    const q = searchQuery.toLowerCase().trim();
    return areas.filter(
      (a) =>
        a.name?.toLowerCase().includes(q) ||
        a.city?.toLowerCase().includes(q) ||
        a.slug?.toLowerCase().includes(q)
    );
  }, [areas, searchQuery]);

  const totalMerchants = areas.reduce((sum, a) => sum + (a._count?.merchants || 0), 0);
  const totalCoupons = areas.reduce((sum, a) => sum + (a._count?.coupons || 0), 0);

  return (
    <div className="w-full px-4 py-4 sm:px-6 lg:px-8 lg:py-6">
      <section className="w-full rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        {/* Top Header */}
        <div className="flex flex-col gap-4 border-b border-slate-100 pb-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-semibold leading-8 text-slate-900">
              Area QR Codes
            </h1>
            <p className="mt-1 text-sm leading-5 text-slate-500">
              Branded scannable QR codes that instantly open localized directories in the mobile app.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleRegenerateAll}
              disabled={regeneratingAll || loading || areas.length === 0}
              className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-[#f97316] px-4 text-xs font-semibold text-white shadow-sm transition-opacity hover:opacity-95 disabled:opacity-50 cursor-pointer"
            >
              <span className={regeneratingAll ? "animate-spin" : ""}>⚡</span>
              {regeneratingAll ? "Regenerating..." : "Regenerate All QR Codes"}
            </button>

            <button
              type="button"
              onClick={() => refetch()}
              disabled={loading}
              className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3.5 text-xs font-medium text-slate-700 transition hover:bg-slate-100 disabled:opacity-50 cursor-pointer"
            >
              <span className={loading ? "animate-spin" : ""}>🔄</span> Refresh
            </button>
          </div>
        </div>

        {/* Metric Cards */}
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 sm:p-4">
            <span className="block text-xs font-medium text-slate-500">Total Areas</span>
            <strong className="mt-1 block text-xl font-bold text-slate-900">
              {areas.length}
            </strong>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 sm:p-4">
            <span className="block text-xs font-medium text-slate-500">Ready QR Codes</span>
            <strong className="mt-1 block text-xl font-bold text-emerald-600">
              {areas.length}
            </strong>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 sm:p-4">
            <span className="block text-xs font-medium text-slate-500">Total Businesses</span>
            <strong className="mt-1 block text-xl font-bold text-slate-900">
              {totalMerchants}
            </strong>
          </div>

          <div className="rounded-2xl border border-orange-100 bg-orange-50/50 p-3 sm:p-4">
            <span className="block text-xs font-medium text-[#f97316]">Active Deals Linked</span>
            <strong className="mt-1 block text-xl font-bold text-[#ea580c]">
              {totalCoupons}
            </strong>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mt-5 flex items-center justify-between gap-3">
          <div className="relative w-full max-w-sm">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search area name, city or slug..."
              className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-3.5 pr-8 text-xs text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-[#f97316] focus:bg-white"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-2.5 text-xs text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex h-56 flex-col items-center justify-center gap-3">
            <div className="size-8 animate-spin rounded-full border-4 border-[#f97316] border-t-transparent" />
            <p className="text-sm font-medium text-slate-500">Loading Area QR codes from server...</p>
          </div>
        ) : filteredAreas.length === 0 ? (
          <div className="mt-6 flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 py-16 text-center">
            <div className="grid size-12 place-items-center rounded-full bg-orange-50 text-2xl text-[#f97316]">
              📱
            </div>
            <h3 className="mt-3 text-sm font-semibold text-slate-900">No areas found</h3>
            <p className="mt-1 max-w-sm text-xs text-slate-500">
              {searchQuery
                ? "No areas match your search filter."
                : "No city areas have been created yet. Go to Areas / Directories to add your first area."}
            </p>
          </div>
        ) : (
          /* Cards Grid */
          <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filteredAreas.map((area) => {
              const qrUrl = getEffectiveQrUrl(area);
              const isRegenerating = regeneratingId === area.id;

              return (
                <article
                  key={area.id}
                  className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div>
                    {/* Header info */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h2 className="truncate text-lg font-bold text-slate-900">
                          {area.name}
                        </h2>
                        <p className="truncate text-xs text-slate-500">
                          {area.city}, {area.state}
                        </p>
                      </div>
                      <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                        ✓ Active QR
                      </span>
                    </div>

                    {/* QR Code Container */}
                    <div className="mt-4 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/70 p-4">
                      <div className="relative size-44 rounded-xl bg-white p-2 shadow-sm border border-slate-100 grid place-items-center">
                        <img
                          src={qrUrl}
                          alt={`QR for ${area.name}`}
                          className="size-full object-contain"
                          loading="lazy"
                        />
                        {isRegenerating && (
                          <div className="absolute inset-0 grid place-items-center bg-white/80 rounded-xl">
                            <div className="size-6 animate-spin rounded-full border-2 border-[#f97316] border-t-transparent" />
                          </div>
                        )}
                      </div>

                      {/* Directory Link Pill */}
                      <button
                        type="button"
                        onClick={() => handleCopyLink(area.slug)}
                        className="mt-3 flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-mono text-slate-600 hover:border-orange-400 hover:text-slate-900 transition-colors max-w-full cursor-pointer"
                        title="Click to copy public link"
                      >
                        <span className="truncate">/directory/{area.slug}</span>
                        <span className="shrink-0 text-slate-400">
                          {copiedSlug === area.slug ? "✓" : "📋"}
                        </span>
                      </button>
                    </div>

                    {/* Linked Stats */}
                    <div className="mt-4 flex items-center justify-between text-xs text-slate-500 px-1">
                      <span>🏪 {area._count?.merchants || 0} Businesses</span>
                      <span>🏷️ {area._count?.coupons || 0} Live Deals</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-5 grid grid-cols-3 gap-2 pt-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => handleDownloadQr(area)}
                      className="flex flex-col items-center justify-center gap-1 rounded-xl border border-slate-200 bg-slate-50 py-2 text-[11px] font-medium text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                    >
                      <span className="text-base leading-none">⬇️</span>
                      Download
                    </button>

                    <button
                      type="button"
                      onClick={() => handlePrintFlyer(area)}
                      className="flex flex-col items-center justify-center gap-1 rounded-xl border border-slate-200 bg-slate-50 py-2 text-[11px] font-medium text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                    >
                      <span className="text-base leading-none">🖨️</span>
                      Print Display
                    </button>

                    <button
                      type="button"
                      onClick={() => handleRegenerateQr(area)}
                      disabled={isRegenerating}
                      className="flex flex-col items-center justify-center gap-1 rounded-xl border border-slate-200 bg-slate-50 py-2 text-[11px] font-medium text-slate-700 hover:bg-slate-100 transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      <span className={`text-base leading-none ${isRegenerating ? "animate-spin" : ""}`}>🔄</span>
                      Regenerate
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 rounded-xl bg-slate-900/90 px-4 py-2.5 text-xs font-medium text-white shadow-xl backdrop-blur animate-in fade-in slide-in-from-bottom-3">
          {toastMessage}
        </div>
      )}
    </div>
  );
}
