"use client";

import { useState, useMemo } from "react";
import { emptyRedemptions } from "@/api/redemptions";
import { useRedemptionAreas, useRedemptions } from "@/hooks/useRedemptions";

function formatRedeemedDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Recently";

    const now = new Date();
    const isToday =
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear();

    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday =
      date.getDate() === yesterday.getDate() &&
      date.getMonth() === yesterday.getMonth() &&
      date.getFullYear() === yesterday.getFullYear();

    const timeStr = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    if (isToday) {
      return `Today, ${timeStr}`;
    }
    if (isYesterday) {
      return `Yesterday, ${timeStr}`;
    }
    return `${date.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })}, ${timeStr}`;
  } catch {
    return "Recently";
  }
}

export default function RedemptionsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedArea, setSelectedArea] = useState("ALL");
  const { data: redemptions = emptyRedemptions, isLoading: loading, refetch } = useRedemptions(selectedArea);
  const { data: areas = [] } = useRedemptionAreas();
  const items = redemptions.items || [];
  const stats = redemptions;

  // Client-side search filtering
  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return items;
    const q = searchQuery.toLowerCase().trim();
    return items.filter((item) => {
      const userName = item.user?.fullName?.toLowerCase() || "";
      const userEmail = item.user?.email?.toLowerCase() || "";
      const userPhone = item.user?.phoneNumber?.toLowerCase() || "";
      const couponTitle = item.coupon?.title?.toLowerCase() || "";
      const couponCode = item.coupon?.couponCode?.toLowerCase() || "";
      const merchantName = item.coupon?.merchant?.name?.toLowerCase() || "";
      const areaName = item.coupon?.area?.name?.toLowerCase() || "";

      return (
        userName.includes(q) ||
        userEmail.includes(q) ||
        userPhone.includes(q) ||
        couponTitle.includes(q) ||
        couponCode.includes(q) ||
        merchantName.includes(q) ||
        areaName.includes(q)
      );
    });
  }, [items, searchQuery]);

  return (
    <div className="w-full px-4 py-4 sm:px-6 lg:px-8 lg:py-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Coupon Redemptions</h1>
            <p className="mt-1 text-sm leading-5 text-slate-500">
              Live log of redeemed coupons across users, businesses, areas and timestamps.
            </p>
          </div>
          <button
            onClick={() => refetch()}
            disabled={loading}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3.5 text-xs font-medium text-slate-700 transition hover:bg-slate-100 disabled:opacity-50 cursor-pointer"
          >
            <span className={loading ? "animate-spin" : ""}>🔄</span> Refresh Live Data
          </button>
        </div>

        {/* Dynamic Metric Cards */}
        <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 sm:p-4">
            <span className="block text-xs font-medium text-slate-500">Today</span>
            <strong className="mt-1 block text-xl font-bold text-slate-900">
              {stats.todayCount}
            </strong>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 sm:p-4">
            <span className="block text-xs font-medium text-slate-500">This Week</span>
            <strong className="mt-1 block text-xl font-bold text-slate-900">
              {stats.thisWeekCount}
            </strong>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 sm:p-4">
            <span className="block text-xs font-medium text-slate-500">This Month</span>
            <strong className="mt-1 block text-xl font-bold text-slate-900">
              {stats.thisMonthCount}
            </strong>
          </div>

          <div className="rounded-2xl border border-orange-100 bg-orange-50/50 p-3 sm:p-4">
            <span className="block text-xs font-medium text-[#f97316]">Total Redemptions</span>
            <strong className="mt-1 block text-xl font-bold text-[#ea580c]">
              {stats.total}
            </strong>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by user, coupon, code or business..."
              className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-3.5 pr-8 text-xs text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-[#f97316] focus:bg-white"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-2.5 text-xs text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedArea}
              onChange={(e) => setSelectedArea(e.target.value)}
              className="h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-medium text-slate-700 outline-none transition focus:border-[#f97316] focus:bg-white cursor-pointer"
            >
              <option value="ALL">All Areas</option>
              {areas.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} ({a.city})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex h-56 flex-col items-center justify-center gap-3">
            <div className="size-8 animate-spin rounded-full border-4 border-[#f97316] border-t-transparent" />
            <p className="text-sm font-medium text-slate-500">Loading redemptions from server...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="mt-6 flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 py-16 text-center">
            <div className="grid size-12 place-items-center rounded-full bg-orange-50 text-2xl text-[#f97316]">
              🏷️
            </div>
            <h3 className="mt-3 text-sm font-semibold text-slate-900">No redemptions found</h3>
            <p className="mt-1 max-w-sm text-xs text-slate-500">
              {searchQuery || selectedArea !== "ALL"
                ? "No redeemed coupons matched your search or area filters."
                : "No coupons have been redeemed yet. Once mobile app users redeem coupons, they will show up here in real time."}
            </p>
          </div>
        ) : (
          <>
            {/* Mobile Card List View */}
            <div className="mt-4 grid gap-3 lg:hidden">
              {filteredItems.map((item) => (
                <article
                  key={item.id}
                  className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="truncate text-sm font-semibold text-slate-900">
                        {item.coupon?.title || "Coupon"}
                      </h2>
                      {item.coupon?.couponCode && (
                        <span className="mt-1 inline-block font-mono text-[11px] font-semibold text-orange-600 bg-orange-50 px-2 py-0.5 rounded">
                          {item.coupon.couponCode}
                        </span>
                      )}
                      <p className="mt-1 text-xs text-slate-500">
                        {formatRedeemedDate(item.createdAt)}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700">
                      ✓ Redeemed
                    </span>
                  </div>

                  <div className="mt-3 grid gap-2 rounded-xl bg-slate-50 p-3 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-slate-500">Customer</span>
                      <strong className="text-right font-medium text-slate-900 truncate">
                        {item.user?.fullName || "App User"}
                      </strong>
                    </div>
                    {item.user?.phoneNumber && (
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-slate-500">Phone</span>
                        <span className="text-right text-slate-700">
                          {item.user.phoneNumber}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-slate-500">Business</span>
                      <strong className="text-right font-medium text-slate-900 truncate">
                        {item.coupon?.merchant?.name || "—"}
                      </strong>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-slate-500">Area</span>
                      <span className="text-right text-slate-700 truncate">
                        {item.coupon?.area?.name || "—"}
                      </span>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            {/* Desktop Table View */}
            <div className="mt-4 hidden overflow-hidden rounded-xl border border-slate-200 lg:block">
              <div className="grid h-[50px] grid-cols-[1.4fr_1.1fr_1.2fr_1fr_150px_100px] items-center bg-slate-100 text-xs font-semibold uppercase tracking-wider text-[#315576]">
                {[
                  "Coupon",
                  "Customer",
                  "Business",
                  "Area",
                  "Redeemed At",
                  "Status",
                ].map((heading) => (
                  <div
                    className="border-r border-slate-300 px-4 py-3 last:border-r-0"
                    key={heading}
                  >
                    {heading}
                  </div>
                ))}
              </div>

              {filteredItems.map((item) => (
                <div
                  key={item.id}
                  className="grid grid-cols-[1.4fr_1.1fr_1.2fr_1fr_150px_100px] items-center border-t border-dashed border-slate-200 bg-white text-sm hover:bg-slate-50/60 transition-colors"
                >
                  {/* Coupon Title & Code */}
                  <div className="min-w-0 px-4 py-3">
                    <strong className="block truncate text-sm font-medium text-slate-900">
                      {item.coupon?.title || "Coupon"}
                    </strong>
                    {item.coupon?.couponCode && (
                      <span className="mt-0.5 inline-block font-mono text-[11px] font-medium text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded">
                        CODE: {item.coupon.couponCode}
                      </span>
                    )}
                  </div>

                  {/* Customer Info */}
                  <div className="min-w-0 px-4 py-3">
                    <strong className="block truncate text-sm font-medium text-slate-900">
                      {item.user?.fullName || "App User"}
                    </strong>
                    <small className="block truncate text-xs text-slate-500">
                      {item.user?.phoneNumber || item.user?.email || "—"}
                    </small>
                  </div>

                  {/* Business / Merchant */}
                  <div className="min-w-0 px-4 py-3">
                    <strong className="block truncate text-sm font-medium text-slate-900">
                      {item.coupon?.merchant?.name || "—"}
                    </strong>
                  </div>

                  {/* Area */}
                  <div className="min-w-0 px-4 py-3">
                    <p className="truncate text-sm text-slate-800">
                      {item.coupon?.area?.name || "—"}
                    </p>
                    {item.coupon?.area?.city && (
                      <small className="block truncate text-xs text-slate-400">
                        {item.coupon.area.city}
                      </small>
                    )}
                  </div>

                  {/* Timestamp */}
                  <div className="min-w-0 px-4 py-3">
                    <span className="block truncate text-xs font-medium text-slate-700">
                      {formatRedeemedDate(item.createdAt)}
                    </span>
                  </div>

                  {/* Status Badge */}
                  <div className="px-4 py-3">
                    <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                      Redeemed
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  );
}
