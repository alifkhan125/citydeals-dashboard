"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useGlobalSearch } from "@/hooks/useGlobalSearch";

const assetBase = "/assets/dashboard/";

const typeTone: Record<string, string> = {
  User: "bg-blue-50 text-blue-700",
  Business: "bg-emerald-50 text-emerald-700",
  Coupon: "bg-orange-50 text-[#f97316]",
  Category: "bg-violet-50 text-violet-700",
  Staff: "bg-slate-100 text-slate-700",
};

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const normalizedQuery = query.trim();
  const { data, isFetching } = useGlobalSearch(query);
  const results = data?.results ?? [];

  const groupedCounts = useMemo(() => {
    return results.reduce<Record<string, number>>((acc, item) => {
      acc[item.type] = (acc[item.type] ?? 0) + 1;
      return acc;
    }, {});
  }, [results]);

  return (
    <div className="w-full px-4 py-4 sm:px-6 lg:px-8 lg:py-6">
      <section className="w-full rounded-2xl border border-[#d1d5db] bg-white p-3 sm:p-4">
        <div className="px-1 pt-1 sm:px-3">
          <h1 className="m-0 text-2xl font-semibold leading-8 text-slate-900">Search</h1>
          <p className="mt-1 text-sm leading-5 text-[#475569]">
            Search live businesses, coupons, categories, users and staff.
          </p>
        </div>

        <div className="mt-4 flex h-12 items-center gap-3 rounded-xl border border-slate-200 bg-slate-100 px-3 sm:px-4">
          <Image src={`${assetBase}imgSearchNormal.svg`} alt="" width={22} height={22} />
          <input
            className="min-w-0 flex-1 bg-transparent text-sm leading-5 text-slate-900 outline-none placeholder:text-slate-400"
            placeholder="Search anything..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            autoFocus
          />
          {query && (
            <button
              className="text-xs font-medium text-slate-500 hover:text-slate-900"
              type="button"
              onClick={() => setQuery("")}
            >
              Clear
            </button>
          )}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {Object.entries(groupedCounts).map(([type, count]) => (
            <span className={`rounded-full px-3 py-1 text-xs font-medium ${typeTone[type] ?? typeTone.Staff}`} key={type}>
              {type}: {count}
            </span>
          ))}
        </div>

        {normalizedQuery.length > 0 && normalizedQuery.length < 2 && (
          <p className="mt-4 text-sm text-slate-500">Type at least 2 characters to search.</p>
        )}

        {isFetching && (
          <div className="mt-6 flex items-center gap-2 text-sm text-slate-500">
            <span className="size-4 animate-spin rounded-full border-2 border-[#f97316] border-t-transparent" />
            Searching live data...
          </div>
        )}

        {!isFetching && normalizedQuery.length >= 2 && results.length === 0 && (
          <div className="mt-6 rounded-xl border border-dashed border-slate-200 p-8 text-center">
            <p className="text-sm font-medium text-slate-900">No results found</p>
            <p className="mt-1 text-sm text-slate-500">Try a different business, coupon, user, category or staff name.</p>
          </div>
        )}

        {results.length > 0 && (
          <>
            <div className="mt-4 grid gap-3 lg:hidden">
              {results.map((item) => (
                <Link className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm" href={item.href} key={`${item.type}-${item.id}`}>
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="min-w-0 text-sm font-medium leading-5 text-slate-900">{item.name}</h2>
                    <span className={`shrink-0 rounded px-2 py-1 text-xs font-medium ${typeTone[item.type] ?? typeTone.Staff}`}>
                      {item.type}
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-5 text-[#475569]">{item.detail || "No details"}</p>
                </Link>
              ))}
            </div>

            <div className="mt-4 hidden overflow-hidden rounded-lg border border-slate-200 lg:block">
              <div className="grid h-[55px] grid-cols-[minmax(260px,1.2fr)_160px_minmax(280px,1.5fr)_130px] items-center bg-slate-100 text-sm leading-5 text-[#315576]">
                <div className="border-r border-slate-300 px-3">Name</div>
                <div className="border-r border-slate-300 px-3">Type</div>
                <div className="border-r border-slate-300 px-3">Details</div>
                <div className="px-3">Status</div>
              </div>
              {results.map((item) => (
                <Link
                  className="grid h-[52px] grid-cols-[minmax(260px,1.2fr)_160px_minmax(280px,1.5fr)_130px] items-center border-b border-dashed border-slate-200 transition hover:bg-slate-50 last:border-b-0"
                  href={item.href}
                  key={`${item.type}-${item.id}`}
                >
                  <p className="truncate px-3 text-sm leading-5 text-slate-900">{item.name}</p>
                  <p className="px-3 text-sm leading-5 text-[#475569]">{item.type}</p>
                  <p className="truncate px-3 text-sm leading-5 text-slate-900">{item.detail || "No details"}</p>
                  <p className="truncate px-3 text-xs font-medium leading-5 text-slate-500">{item.status || "-"}</p>
                </Link>
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  );
}
