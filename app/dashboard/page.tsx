"use client";

import Image from "next/image";
import { useMemo } from "react";
import { emptyDashboardStats } from "@/api/dashboard";
import { useDashboardOverview } from "@/hooks/useDashboardOverview";

const assetBase = "/assets/dashboard/";

export default function Dashboard() {
  const { data, isLoading, isRefetching, refetch } = useDashboardOverview();
  const stats = data?.stats ?? emptyDashboardStats;
  const trending = data?.trending ?? [];
  const areaRedemptions = data?.areaRedemptions ?? [];
  const dailyPoints = data?.dailyRedemptions ?? [];

  const statCards = [
    {
      label: "Businesses",
      value: stats.businesses.toLocaleString(),
      icon: "imgShop1.svg",
      tone: "bg-[#dcfce7]",
    },
    {
      label: "Registered users",
      value: stats.registeredUsers.toLocaleString(),
      icon: "imgUser1.svg",
      tone: "bg-[#ede9fe]",
    },
    {
      label: "Coupons",
      value: stats.coupons.toLocaleString(),
      icon: "imgTicket1.svg",
      tone: "bg-[#ffedd5]",
      meta: `${stats.liveCoupons} live`,
    },
    {
      label: "Coupons saved",
      value: stats.couponsSaved.toLocaleString(),
      icon: "imgArchiveTick.svg",
      tone: "bg-[#dcfce7]",
    },
    {
      label: "Redemptions",
      value: stats.redemptions.toLocaleString(),
      icon: "imgTicketExpired.svg",
      tone: "bg-[#dcfce7]",
    },
  ];

  // Dynamic area bar calculations
  const { areaBars, maxAreaRedemptions } = useMemo(() => {
    if (!areaRedemptions || areaRedemptions.length === 0) {
      return { areaBars: [], maxAreaRedemptions: 0 };
    }
    const max = Math.max(...areaRedemptions.map((a) => a.redemptions), 1);
    const bars = areaRedemptions.slice(0, 8).map((area) => {
      const heightPercent = area.redemptions > 0 
        ? Math.round((area.redemptions / max) * 75) + 15 
        : 8;
      return {
        ...area,
        heightPercent,
      };
    });
    return { areaBars: bars, maxAreaRedemptions: max };
  }, [areaRedemptions]);

  // Hourly / daily distribution calculation
  const { hourlyDistribution, maxDailyCount } = useMemo(() => {
    const buckets: Record<string, number> = {
      "00:00": 0,
      "04:00": 0,
      "08:00": 0,
      "12:00": 0,
      "16:00": 0,
      "20:00": 0,
    };

    dailyPoints.forEach((point) => {
      const date = new Date(point.time);
      const hour = date.getHours();
      if (hour < 4) buckets["00:00"] += point.count;
      else if (hour < 8) buckets["04:00"] += point.count;
      else if (hour < 12) buckets["08:00"] += point.count;
      else if (hour < 16) buckets["12:00"] += point.count;
      else if (hour < 20) buckets["16:00"] += point.count;
      else buckets["20:00"] += point.count;
    });

    const values = Object.values(buckets);
    const max = Math.max(...values, 1);
    return { hourlyDistribution: buckets, maxDailyCount: max };
  }, [dailyPoints]);

  return (
    <div className="w-full px-4 pb-10 pt-4 sm:px-6 lg:px-8 lg:pb-[79px] lg:pt-[18px]">
      {/* Header bar with live refresh */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
            Live Overview
          </h1>
          <p className="text-xs text-slate-500 sm:text-sm">
            Real-time analytics and activity monitoring for CityDeals
          </p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isRefetching}
          className="flex h-9 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-xs transition hover:bg-slate-50 disabled:opacity-50"
          title="Refresh dashboard stats"
        >
          <svg
            className={`size-3.5 ${isRefetching ? "animate-spin text-orange-500" : "text-slate-500"}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          <span className="hidden sm:inline">Refresh Data</span>
        </button>
      </div>

      {/* KPI Stats Cards */}
      <section
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5"
        aria-label="Dashboard stats"
      >
        {statCards.map((stat) => (
          <article
            className="flex min-h-[93px] items-center gap-2.5 rounded-2xl border border-slate-200 bg-white px-2.5 py-3.5 shadow-[0_1px_1px_rgba(15,23,42,0.08),0_1px_1.5px_rgba(15,23,42,0.10)]"
            key={stat.label}
          >
            <div className={`grid size-10 shrink-0 place-items-center rounded-full ${stat.tone}`}>
              <Image src={`${assetBase}${stat.icon}`} alt="" width={22} height={22} />
            </div>
            <div>
              <p className="m-0 whitespace-nowrap text-sm leading-5 text-[#315576]">{stat.label}</p>
              <strong className="mt-0.5 inline-block text-2xl font-semibold leading-8 text-slate-900">
                {isLoading ? "..." : stat.value}
              </strong>
              {stat.meta && !isLoading && (
                <span className="ml-2 text-xs leading-4 text-slate-500">{stat.meta}</span>
              )}
            </div>
          </article>
        ))}
      </section>

      {/* Daily Redemptions Area Chart */}
      <section
        className="mt-4 min-h-[372px] rounded-2xl border border-[#d8d3c5] bg-white px-4 pb-[18px] pt-5 sm:px-6"
        aria-labelledby="daily-title"
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="m-0 text-xl font-medium leading-7 text-slate-900" id="daily-title">
              Daily Redemptions Activity
            </h2>
            <p className="mt-0.5 text-sm leading-5 text-slate-500">
              Coupon redemptions recorded today across all areas ({dailyPoints.length} total events)
            </p>
          </div>
          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
            Live Stream
          </span>
        </div>

        <div className="mt-[18px] grid h-[284px] grid-cols-[34px_minmax(0,1fr)] gap-2.5">
          <div className="flex flex-col justify-between pb-7 text-right text-xs leading-4 text-slate-400">
            <span>{maxDailyCount}</span>
            <span>{Math.round(maxDailyCount * 0.75)}</span>
            <span>{Math.round(maxDailyCount * 0.5)}</span>
            <span>{Math.round(maxDailyCount * 0.25)}</span>
            <span>0</span>
          </div>
          <div className="relative min-w-0">
            <div className="absolute inset-x-0 bottom-7 top-0 border-b border-l border-[#eef3f8] bg-[repeating-linear-gradient(to_bottom,transparent_0,transparent_44px,#eef3f8_45px)]" />
            <svg
              className="absolute inset-x-0 top-0 h-[calc(100%-32px)] w-full"
              viewBox="0 0 1010 230"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <defs>
                <linearGradient id="dailyFill" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#fb923c" stopOpacity="0.42" />
                  <stop offset="100%" stopColor="#fb923c" stopOpacity="0.04" />
                </linearGradient>
              </defs>
              <path
                d="M 6 187 C 76 178 110 102 170 111 C 242 121 257 175 318 168 C 392 160 409 73 484 80 C 566 88 567 183 638 177 C 715 171 733 89 800 97 C 872 105 908 154 1004 136 L 1004 230 L 6 230 Z"
                fill="url(#dailyFill)"
              />
              <path
                d="M 6 187 C 76 178 110 102 170 111 C 242 121 257 175 318 168 C 392 160 409 73 484 80 C 566 88 567 183 638 177 C 715 171 733 89 800 97 C 872 105 908 154 1004 136"
                fill="none"
                stroke="#f97316"
                strokeLinecap="round"
                strokeWidth="3"
              />
            </svg>
            <div className="absolute inset-x-0 bottom-0 flex justify-between text-xs leading-4 text-slate-400">
              {Object.keys(hourlyDistribution).map((label) => (
                <span key={label} className="text-center font-medium">
                  {label}
                  {hourlyDistribution[label] > 0 && (
                    <small className="block text-[10px] text-orange-600 font-bold">
                      ({hourlyDistribution[label]})
                    </small>
                  )}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Grid: Redemptions by Area & Trending Coupons */}
      <section className="mt-4 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Redemptions by Area Chart */}
        <article className="min-h-[356px] rounded-2xl border border-[#d8d3c5] bg-white px-4 py-5 sm:px-6">
          <h2 className="m-0 text-xl font-medium leading-7 text-slate-900">Redemptions by Area</h2>
          <p className="mt-0.5 text-sm leading-5 text-slate-500">
            {areaRedemptions.length > 0
              ? `Real-time activity across ${areaRedemptions.length} areas (Max: ${maxAreaRedemptions})`
              : "No area redemptions recorded yet"}
          </p>

          <div className="mt-[22px] flex h-[254px] items-end justify-between gap-2.5 border-b border-[#eef3f8] pb-2 pt-4 px-2">
            {areaBars.length === 0 ? (
              <div className="flex size-full items-center justify-center text-sm text-slate-400">
                No area redemption data available
              </div>
            ) : (
              areaBars.map((area) => (
                <div
                  className="flex flex-1 h-full flex-col items-center justify-end gap-2 text-xs leading-4 text-slate-600 group relative"
                  key={area.areaId}
                >
                  <span className="text-[11px] font-bold text-slate-800">
                    {area.redemptions}
                  </span>
                  <span
                    className="min-h-5 w-full max-w-[42px] rounded-t-lg bg-emerald-600 transition-all duration-300 group-hover:bg-emerald-500 shadow-[inset_0_-10px_16px_rgba(12,74,110,0.12)]"
                    style={{ height: `${area.heightPercent}%` }}
                  />
                  <small
                    className="truncate max-w-[55px] text-[11px] font-medium text-slate-500"
                    title={area.areaName}
                  >
                    {area.areaName}
                  </small>
                </div>
              ))
            )}
          </div>
        </article>

        {/* Trending Coupons Card */}
        <article className="min-h-[356px] rounded-2xl border border-[#d8d3c5] bg-white px-4 py-5 sm:px-6">
          <h2 className="m-0 text-xl font-medium leading-7 text-slate-900">Trending Coupons</h2>
          <p className="mt-0.5 text-sm leading-5 text-slate-500">Top saved and redeemed coupons</p>
          <div className="mt-[18px] grid gap-[15px]">
            {trending.length === 0 ? (
              <p className="text-sm text-slate-400">No active trending coupons yet.</p>
            ) : (
              trending.slice(0, 6).map((coupon) => {
                const totalActivity = (coupon._count?.savedBy || 0) + (coupon._count?.redemptions || 0);
                const percent = Math.min(100, Math.max(15, totalActivity * 10));
                return (
                  <div className="grid gap-2" key={coupon.id}>
                    <div className="flex items-center justify-between gap-3 text-sm leading-5 text-slate-900">
                      <strong className="font-medium truncate">{coupon.title}</strong>
                      <span className="text-slate-500 shrink-0 text-xs">
                        {coupon.merchant?.name || "Deal"}
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-sky-200">
                      <span
                        className="block h-full rounded-full bg-sky-600 transition-all duration-500"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </article>
      </section>
    </div>
  );
}
