"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useAuthStore } from "@/store/useAuthStore";

const assetBase = "/assets/dashboard/";

const notifications = [
  {
    title: "New coupon redeemed",
    message: "Weekend BOGO was redeemed by a user.",
    time: "2 min ago",
    unread: true,
  },
  {
    title: "Business approved",
    message: "Harlem Jazz Cafe is now active.",
    time: "18 min ago",
    unread: true,
  },
  {
    title: "Campaign scheduled",
    message: "Free Delivery notification is ready to send.",
    time: "1 hour ago",
    unread: false,
  },
];

type HeaderProps = {
  onMenuClick?: () => void;
};

export default function Header({ onMenuClick }: HeaderProps) {
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);
  const [showNotifications, setShowNotifications] = useState(false);
  const profileImage =
    user?.profilePictureUrl ||
    (user?.fullName
      ? `https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullName)}&background=ea580c&color=ffffff&bold=true`
      : `${assetBase}imgAdminAvatarNew.png`);

  const getPageTitle = () => {
    if (!pathname) return "Dashboard";
    if (pathname.includes("businesses")) return "Businesses";
    if (pathname.includes("categories")) return "Categories";
    if (pathname.includes("coupons")) return "Coupons";
    if (pathname === "/notification") return "Send notifications";
    if (pathname === "/notifications") return "Notification inbox";
    if (pathname.includes("users")) return "Users";
    if (pathname.includes("staff")) return "Staff accounts";
    if (pathname.includes("roles")) return "Roles & permissions";
    if (pathname.includes("search")) return "Search";
    if (pathname.includes("profile")) return "Profile";
    return "Dashboard";
  };

  return (
    <header className="sticky top-0 z-30 flex min-h-[64px] items-center justify-between gap-3 border-b border-[#eef3f8] bg-white px-4 py-2 lg:min-h-[74px] lg:px-8">
      <div className="flex min-w-0 items-center gap-2 text-sm leading-[22px] tracking-[0.22px]">
        <button
          className="grid size-10 shrink-0 place-items-center rounded-xl border border-slate-200 bg-slate-50 text-slate-700 lg:hidden"
          type="button"
          aria-label="Open navigation"
          onClick={onMenuClick}
        >
          <svg className="size-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <span className="shrink-0 text-[#919eab]">CityDeals</span>
        <span className="shrink-0 text-[#919eab]">/</span>
        <strong className="truncate font-normal text-[#141a21]">{getPageTitle()}</strong>
      </div>

      <div className="flex shrink-0 items-center gap-2 sm:gap-3 lg:gap-4">
        <Link
          className="grid size-10 place-items-center rounded-2xl bg-slate-50 shadow-sm transition-colors hover:bg-slate-100 sm:size-12 sm:rounded-[25px_22.5px_25px_25px]"
          href="/search"
          aria-label="Search"
        >
          <Image src={`${assetBase}imgSearchNormal.svg`} alt="" width={24} height={24} />
        </Link>

        <div className="relative">
          <button
            className="relative grid size-10 place-items-center rounded-2xl bg-slate-50 shadow-sm transition-colors hover:bg-slate-100 sm:size-12 sm:rounded-[25px_22.5px_25px_25px]"
            type="button"
            aria-label="Notifications"
            aria-expanded={showNotifications}
            onClick={() => setShowNotifications((value) => !value)}
          >
            <Image src={`${assetBase}imgNotification.svg`} alt="" width={24} height={24} />
            <span className="absolute right-3 top-3 size-2 rounded-full bg-[#ff6b13]" />
          </button>

          {showNotifications && (
            <div className="fixed left-4 right-4 top-[68px] z-50 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.16)] sm:absolute sm:left-auto sm:right-0 sm:top-[58px] sm:w-[360px]">
              <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                <div>
                  <h2 className="text-base font-semibold leading-6 text-slate-900">Notifications</h2>
                  <p className="text-xs leading-4 text-slate-500">Latest app activity</p>
                </div>
                <span className="rounded-full bg-orange-50 px-2.5 py-1 text-xs font-medium text-[#f97316]">
                  2 new
                </span>
              </div>

              <div className="max-h-[320px] overflow-y-auto p-2">
                {notifications.map((notification) => (
                  <div
                    className="flex gap-3 rounded-xl px-3 py-3 transition-colors hover:bg-slate-50"
                    key={notification.title}
                  >
                    <span
                      className={`mt-1 size-2 rounded-full ${
                        notification.unread ? "bg-[#f97316]" : "bg-slate-300"
                      }`}
                    />
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-semibold leading-5 text-slate-900">
                        {notification.title}
                      </h3>
                      <p className="mt-0.5 text-sm leading-5 text-slate-600">
                        {notification.message}
                      </p>
                      <p className="mt-1 text-xs leading-4 text-slate-400">{notification.time}</p>
                    </div>
                  </div>
                ))}
              </div>

              <Link
                className="block border-t border-slate-100 px-4 py-3 text-center text-sm font-medium text-[#0f5b78] transition-colors hover:bg-slate-50"
                href="/notifications"
                onClick={() => setShowNotifications(false)}
              >
                View all notifications
              </Link>
            </div>
          )}
        </div>

        <Link
          className="flex size-10 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-left transition-colors hover:bg-slate-100 sm:h-[58px] sm:w-[225px] sm:justify-start sm:gap-2 sm:rounded-lg sm:px-4 sm:py-1.5"
          href="/profile"
          aria-label="Profile"
        >
          <span className="grid size-8 shrink-0 place-items-center overflow-hidden rounded-lg border border-[#0c4a6e] p-0.5 sm:size-[37px]">
            <Image
              className="size-full rounded-md object-cover"
              src={profileImage}
              alt=""
              width={33}
              height={33}
              unoptimized={profileImage.startsWith("http")}
            />
          </span>
          <span className="hidden min-w-0 sm:block">
            <strong className="block text-base font-normal leading-6 text-slate-900">
              {user?.fullName || "Admin"}
            </strong>
            <small className="block truncate text-sm leading-5 text-slate-600/65">
              {user?.email || "admin@citydeals"}
            </small>
          </span>
        </Link>
      </div>
    </header>
  );
}

