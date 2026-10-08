"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useNotificationHistory } from "@/hooks/useNotifications";

function formatRelativeTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Recently";

    const diff = Math.floor((Date.now() - date.getTime()) / 1000);
    if (diff < 60) return "Just now";
    if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hour${Math.floor(diff / 3600) > 1 ? "s" : ""} ago`;
    if (diff < 172800) return "Yesterday";
    return date.toLocaleDateString([], { month: "short", day: "numeric" });
  } catch {
    return "Recently";
  }
}

export default function NotificationsPage() {
  const { data: notifications = [], isLoading: loading, refetch } = useNotificationHistory();
  const [filter, setFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredNotifications = useMemo(() => {
    return notifications.filter((item) => {
      // Filter status
      if (filter === "Unread" && item.readAt !== null) return false;
      if (filter === "Read" && item.readAt === null) return false;

      // Filter search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const titleMatch = item.title?.toLowerCase().includes(q);
        const bodyMatch = item.body?.toLowerCase().includes(q);
        const userMatch = item.user?.fullName?.toLowerCase().includes(q);
        const emailMatch = item.user?.email?.toLowerCase().includes(q);
        if (!titleMatch && !bodyMatch && !userMatch && !emailMatch) return false;
      }

      return true;
    });
  }, [notifications, filter, searchQuery]);

  return (
    <div className="w-full px-4 py-4 sm:px-6 lg:px-8 lg:py-6">
      <section className="w-full rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-4 border-b border-slate-100 pb-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold leading-8 text-slate-900">
              Notification Inbox
            </h1>
            <p className="mt-1 text-sm leading-5 text-slate-500">
              Live history of delivered announcements, alerts and system notifications.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/notification"
              className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-[#f97316] px-4 text-xs font-semibold text-white shadow-sm hover:opacity-95 transition-opacity"
            >
              + Send New Notification
            </Link>
            <button
              onClick={() => refetch()}
              disabled={loading}
              className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 px-3.5 text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors disabled:opacity-50 cursor-pointer"
            >
              <span className={loading ? "animate-spin mr-1" : "mr-1"}>🔄</span> Refresh
            </button>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-sm">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search notifications..."
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

          <div className="flex items-center gap-2">
            <select
              className="h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-medium text-slate-800 outline-none focus:border-orange-400 cursor-pointer"
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
            >
              <option value="All">All Statuses</option>
              <option value="Unread">Unread Only</option>
              <option value="Read">Read Only</option>
            </select>
          </div>
        </div>

        {/* Content Area */}
        {loading ? (
          <div className="flex h-56 flex-col items-center justify-center gap-3">
            <div className="size-8 animate-spin rounded-full border-4 border-[#f97316] border-t-transparent" />
            <p className="text-sm font-medium text-slate-500">Loading notifications from server...</p>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="mt-6 flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 py-16 text-center">
            <div className="grid size-12 place-items-center rounded-full bg-orange-50 text-2xl text-[#f97316]">
              🔔
            </div>
            <h3 className="mt-3 text-sm font-semibold text-slate-900">No notifications found</h3>
            <p className="mt-1 max-w-sm text-xs text-slate-500">
              {searchQuery || filter !== "All"
                ? "No notifications match your current filter criteria."
                : "No notifications have been broadcast yet. Click 'Send New Notification' to create your first announcement."}
            </p>
            <Link
              href="/notification"
              className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-[#f97316] px-4 py-2 text-xs font-medium text-white shadow-sm hover:opacity-95 transition-opacity"
            >
              Send Notification
            </Link>
          </div>
        ) : (
          <div className="mt-5 grid gap-3">
            {filteredNotifications.map((notification) => {
              const unread = notification.readAt === null;

              return (
                <article
                  className="grid gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-4 transition-colors hover:bg-slate-50/70 sm:px-5 md:grid-cols-[auto_minmax(0,1fr)_auto] md:items-start shadow-sm"
                  key={notification.id}
                >
                  <span
                    className={`hidden size-2.5 rounded-full md:mt-2 md:block ${
                      unread ? "bg-[#f97316]" : "bg-slate-300"
                    }`}
                  />
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-sm font-semibold text-slate-900">
                        {notification.title}
                      </h2>
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700">
                        To: {notification.user?.fullName || "App User"}
                        {notification.user?.area?.name ? ` (${notification.user.area.name})` : ""}
                      </span>
                      {notification.data?.sendTo && (
                        <span className="rounded-full bg-orange-50 px-2 py-0.5 text-[11px] font-medium text-[#f97316]">
                          Scope: {notification.data.sendTo}
                        </span>
                      )}
                    </div>
                    <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">
                      {notification.body}
                    </p>
                  </div>
                  <div className="flex items-center justify-between gap-3 md:block md:text-right">
                    <p className="text-xs text-slate-400">
                      {formatRelativeTime(notification.createdAt)}
                    </p>
                    <span
                      className={`mt-1.5 inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
                        unread ? "bg-orange-50 text-[#f97316]" : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {unread ? "Unread" : "Read"}
                    </span>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
