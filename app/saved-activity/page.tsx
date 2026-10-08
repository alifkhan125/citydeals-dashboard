"use client";

import { useMemo, useState } from "react";
import { emptySavedActivity } from "@/api/savedActivity";
import { useSavedActivity, useSavedActivityAreas } from "@/hooks/useSavedActivity";

function formatSavedDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Recently";

    const diffMinutes = Math.floor((Date.now() - date.getTime()) / 60000);
    if (diffMinutes < 1) return "Just now";
    if (diffMinutes < 60) return `${diffMinutes} min ago`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;

    return date.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return "Recently";
  }
}

export default function SavedActivityPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedArea, setSelectedArea] = useState("ALL");
  const { data: savedActivity = emptySavedActivity, isLoading, refetch } = useSavedActivity(selectedArea);
  const { data: areas = [] } = useSavedActivityAreas();
  const items = savedActivity.items || [];

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

  const uniqueUsers = new Set(items.map((item) => item.user?.id).filter(Boolean)).size;
  const uniqueCoupons = new Set(items.map((item) => item.coupon?.id).filter(Boolean)).size;

  return (
    <div className="w-full px-4 py-4 sm:px-6 lg:px-8 lg:py-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">
              Saved Coupons / User Activity
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Live history of users saving coupons across businesses and areas.
            </p>
          </div>
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isLoading}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3.5 text-xs font-medium text-slate-700 transition hover:bg-slate-100 disabled:opacity-50"
          >
            <span className={isLoading ? "animate-spin" : ""}>Refresh</span>
          </button>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 sm:p-4">
            <span className="block text-xs font-medium text-slate-500">Total Saves</span>
            <strong className="mt-1 block text-xl font-bold text-slate-900">
              {savedActivity.total}
            </strong>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 sm:p-4">
            <span className="block text-xs font-medium text-slate-500">Today</span>
            <strong className="mt-1 block text-xl font-bold text-slate-900">
              {savedActivity.todayCount}
            </strong>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 sm:p-4">
            <span className="block text-xs font-medium text-slate-500">This Week</span>
            <strong className="mt-1 block text-xl font-bold text-slate-900">
              {savedActivity.thisWeekCount}
            </strong>
          </div>
          <div className="rounded-2xl border border-orange-100 bg-orange-50/50 p-3 sm:p-4">
            <span className="block text-xs font-medium text-[#f97316]">Users / Coupons</span>
            <strong className="mt-1 block text-xl font-bold text-[#ea580c]">
              {uniqueUsers} / {uniqueCoupons}
            </strong>
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search user, coupon, code, business or area..."
              className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-3.5 pr-8 text-xs text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-[#f97316] focus:bg-white"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-2.5 text-xs text-slate-400 hover:text-slate-600"
              >
                x
              </button>
            )}
          </div>

          <select
            value={selectedArea}
            onChange={(event) => setSelectedArea(event.target.value)}
            className="h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-medium text-slate-700 outline-none transition focus:border-[#f97316] focus:bg-white"
          >
            <option value="ALL">All Areas</option>
            {areas.map((area) => (
              <option key={area.id} value={area.id}>
                {area.name} ({area.city})
              </option>
            ))}
          </select>
        </div>

        {isLoading ? (
          <div className="flex h-56 flex-col items-center justify-center gap-3">
            <div className="size-8 animate-spin rounded-full border-4 border-[#f97316] border-t-transparent" />
            <p className="text-sm font-medium text-slate-500">Loading saved activity...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="mt-6 flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 py-16 text-center">
            <div className="grid size-12 place-items-center rounded-full bg-orange-50 text-sm font-semibold text-[#f97316]">
              Save
            </div>
            <h3 className="mt-3 text-sm font-semibold text-slate-900">No saved activity found</h3>
            <p className="mt-1 max-w-sm text-xs text-slate-500">
              {searchQuery || selectedArea !== "ALL"
                ? "No saved coupons matched your search or area filters."
                : "When app users save coupons, activity will show up here."}
            </p>
          </div>
        ) : (
          <>
            <div className="mt-4 grid gap-3 lg:hidden">
              {filteredItems.map((item) => (
                <article key={item.id} className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="truncate text-sm font-semibold text-slate-900">
                        {item.coupon?.title || "Coupon"}
                      </h2>
                      <p className="mt-1 text-xs text-slate-500">
                        {item.coupon?.merchant?.name || "Business"} - {item.coupon?.area?.name || "Area"}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-full bg-orange-50 px-2.5 py-1 text-xs font-medium text-[#f97316]">
                      Saved
                    </span>
                  </div>
                  <div className="mt-3 rounded-xl bg-slate-50 p-3 text-xs">
                    <div className="flex justify-between gap-3">
                      <span className="text-slate-500">User</span>
                      <strong className="text-right text-slate-900">{item.user?.fullName || "App User"}</strong>
                    </div>
                    <div className="mt-2 flex justify-between gap-3">
                      <span className="text-slate-500">Contact</span>
                      <span className="text-right text-slate-700">
                        {item.user?.phoneNumber || item.user?.email || "-"}
                      </span>
                    </div>
                    <div className="mt-2 flex justify-between gap-3">
                      <span className="text-slate-500">Saved</span>
                      <span className="text-right text-slate-700">{formatSavedDate(item.createdAt)}</span>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            <div className="mt-5 hidden overflow-hidden rounded-xl border border-slate-200 lg:block">
              <div className="grid grid-cols-[1.1fr_1.5fr_1.2fr_1fr_140px] bg-slate-100 text-sm text-[#315576]">
                {["User", "Coupon", "Business", "Area", "Saved"].map((heading) => (
                  <div className="border-r border-slate-300 px-4 py-3 last:border-r-0" key={heading}>
                    {heading}
                  </div>
                ))}
              </div>
              {filteredItems.map((item) => (
                <div
                  className="grid grid-cols-[1.1fr_1.5fr_1.2fr_1fr_140px] border-t border-dashed border-slate-200 text-sm transition-colors hover:bg-slate-50"
                  key={item.id}
                >
                  <div className="min-w-0 px-4 py-3">
                    <strong className="block truncate text-slate-900">
                      {item.user?.fullName || "App User"}
                    </strong>
                    <small className="block truncate text-xs text-slate-500">
                      {item.user?.phoneNumber || item.user?.email || "-"}
                    </small>
                  </div>
                  <div className="min-w-0 px-4 py-3">
                    <strong className="block truncate text-slate-900">
                      {item.coupon?.title || "Coupon"}
                    </strong>
                    {item.coupon?.couponCode && (
                      <small className="block truncate font-mono text-xs text-[#f97316]">
                        {item.coupon.couponCode}
                      </small>
                    )}
                  </div>
                  <div className="truncate px-4 py-3">{item.coupon?.merchant?.name || "-"}</div>
                  <div className="px-4 py-3">
                    <span className="block truncate">{item.coupon?.area?.name || "-"}</span>
                    <small className="block truncate text-xs text-slate-500">
                      {item.coupon?.area?.city || ""}
                    </small>
                  </div>
                  <div className="px-4 py-3 text-xs text-slate-500">
                    {formatSavedDate(item.createdAt)}
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
