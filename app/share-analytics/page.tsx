"use client";

import { useMemo, useState } from "react";
import { emptyShareAnalytics } from "@/api/shareAnalytics";
import { useShareAnalytics } from "@/hooks/useShareAnalytics";

function formatChannel(channel: string) {
  return channel
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatRate(rate: number) {
  return `${(rate * 100).toFixed(1)}%`;
}

function formatDate(dateString: string) {
  try {
    return new Date(dateString).toLocaleDateString([], {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "Recently";
  }
}

export default function ShareAnalyticsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [channelFilter, setChannelFilter] = useState("ALL");
  const { data = emptyShareAnalytics, isLoading, refetch } = useShareAnalytics();

  const channelOptions = useMemo(
    () => ["ALL", ...data.byChannel.map((metric) => metric.channel)],
    [data.byChannel],
  );

  const filteredRows = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return data.rows.filter((row) => {
      const matchesChannel = channelFilter === "ALL" || row.channel === channelFilter;
      const matchesSearch =
        !q ||
        row.couponTitle.toLowerCase().includes(q) ||
        row.couponCode?.toLowerCase().includes(q) ||
        row.businessName?.toLowerCase().includes(q) ||
        row.areaName?.toLowerCase().includes(q) ||
        row.channel.toLowerCase().includes(q);

      return matchesChannel && matchesSearch;
    });
  }, [data.rows, searchQuery, channelFilter]);

  const overallOpenRate = data.totalShares > 0 ? data.totalOpens / data.totalShares : 0;

  return (
    <div className="w-full px-4 py-4 sm:px-6 lg:px-8 lg:py-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Coupon Share Analytics</h1>
            <p className="mt-1 text-sm text-slate-500">
              Track coupon sharing by channel, opens, and open rate from live share events.
            </p>
          </div>
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isLoading}
            className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 px-3.5 text-xs font-medium text-slate-700 transition hover:bg-slate-100 disabled:opacity-50"
          >
            <span className={isLoading ? "animate-spin" : ""}>Refresh</span>
          </button>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <span className="block text-xs font-medium text-slate-500">Total Shares</span>
            <strong className="mt-1 block text-2xl font-semibold text-slate-900">
              {data.totalShares.toLocaleString()}
            </strong>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <span className="block text-xs font-medium text-slate-500">Total Opens</span>
            <strong className="mt-1 block text-2xl font-semibold text-slate-900">
              {data.totalOpens.toLocaleString()}
            </strong>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <span className="block text-xs font-medium text-slate-500">Open Rate</span>
            <strong className="mt-1 block text-2xl font-semibold text-slate-900">
              {formatRate(overallOpenRate)}
            </strong>
          </div>
          <div className="rounded-2xl border border-orange-100 bg-orange-50/50 p-4">
            <span className="block text-xs font-medium text-[#f97316]">Channels</span>
            <strong className="mt-1 block text-2xl font-semibold text-[#ea580c]">
              {data.byChannel.length}
            </strong>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {data.byChannel.slice(0, 5).map((metric) => (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4" key={metric.channel}>
              <span className="block text-xs font-medium text-slate-500">
                {formatChannel(metric.channel)}
              </span>
              <strong className="mt-1 block text-lg font-semibold text-slate-900">
                {metric.shares} shares
              </strong>
              <small className="text-xs text-slate-500">
                {metric.opens} opens - {formatRate(metric.openRate)}
              </small>
            </div>
          ))}
        </div>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <input
            type="text"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search coupon, business, area, code or channel..."
            className="h-10 w-full max-w-md rounded-xl border border-slate-200 bg-slate-50 px-3.5 text-xs text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-[#f97316] focus:bg-white"
          />
          <select
            value={channelFilter}
            onChange={(event) => setChannelFilter(event.target.value)}
            className="h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-medium text-slate-700 outline-none transition focus:border-[#f97316] focus:bg-white"
          >
            {channelOptions.map((channel) => (
              <option key={channel} value={channel}>
                {channel === "ALL" ? "All Channels" : formatChannel(channel)}
              </option>
            ))}
          </select>
        </div>

        {isLoading ? (
          <div className="flex h-56 flex-col items-center justify-center gap-3">
            <div className="size-8 animate-spin rounded-full border-4 border-[#f97316] border-t-transparent" />
            <p className="text-sm font-medium text-slate-500">Loading share analytics...</p>
          </div>
        ) : filteredRows.length === 0 ? (
          <div className="mt-6 flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 py-16 text-center">
            <div className="grid size-12 place-items-center rounded-full bg-orange-50 text-sm font-semibold text-[#f97316]">
              Share
            </div>
            <h3 className="mt-3 text-sm font-semibold text-slate-900">No share analytics found</h3>
            <p className="mt-1 max-w-sm text-xs text-slate-500">
              Share activity will appear here once users share coupons from the mobile app.
            </p>
          </div>
        ) : (
          <div className="mt-5 overflow-hidden rounded-xl border border-slate-200">
            <div className="grid grid-cols-[1.5fr_1.1fr_110px_110px_120px_130px] bg-slate-100 text-sm text-[#315576]">
              {["Coupon", "Channel", "Shares", "Opens", "Open rate", "Last activity"].map((heading) => (
                <div className="border-r border-slate-300 px-4 py-3 last:border-r-0" key={heading}>
                  {heading}
                </div>
              ))}
            </div>
            {filteredRows.map((row) => (
              <div
                className="grid grid-cols-[1.5fr_1.1fr_110px_110px_120px_130px] border-t border-dashed border-slate-200 text-sm transition-colors hover:bg-slate-50"
                key={`${row.couponId}-${row.channel}`}
              >
                <div className="min-w-0 px-4 py-3">
                  <strong className="block truncate text-slate-900">{row.couponTitle}</strong>
                  <small className="block truncate text-xs text-slate-500">
                    {row.businessName || "Business"} - {row.areaName || "Area"}
                  </small>
                </div>
                <div className="px-4 py-3">{formatChannel(row.channel)}</div>
                <div className="px-4 py-3">{row.shares.toLocaleString()}</div>
                <div className="px-4 py-3">{row.opens.toLocaleString()}</div>
                <div className="px-4 py-3">{formatRate(row.openRate)}</div>
                <div className="px-4 py-3 text-xs text-slate-500">
                  {formatDate(row.lastActivityAt)}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
