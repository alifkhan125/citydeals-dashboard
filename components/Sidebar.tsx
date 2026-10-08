"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { toast } from "./Toast";

const assetBase = "/assets/dashboard/";

import { usePermissions } from "@/hooks/usePermissions";

const menuSections = [
  {
    title: "Main",
    items: [{ label: "Dashboard", icon: "imgElement2.svg", href: "/dashboard" }],
  },
  {
    title: "Directory",
    items: [
      { label: "Areas", icon: "imgMapPin.svg", href: "/areas" },
      { label: "Businesses", icon: "imgShop.svg", href: "/businesses", requiredPermission: "manage-business-profiles" },
      { label: "Categories", icon: "imgTag2.svg", href: "/categories", requiredPermission: "manage-coupon-categories" },
    ],
  },
  {
    title: "Coupons",
    items: [
      { label: "Coupons", icon: "imgTicket.svg", href: "/coupons", requiredPermission: "create-edit-coupons" },
      { label: "Redemptions", icon: "imgTicketExpired.svg", href: "/redemptions" },
    ],
  },
  {
    title: "Communication",
    items: [
      { label: "Send Notifications", icon: "imgNotification.svg", href: "/notification" },
      { label: "Support Tickets", icon: "imgNotificationStatus.svg", href: "/support-tickets" },
    ],
  },
  {
    title: "App Control",
    items: [
      { label: "Legal Pages", icon: "imgTicket.svg", href: "/legal-pages", requiredPermission: "edit-app-pages" },
    ],
  },
  {
    title: "People",
    items: [
      { label: "Users", icon: "imgUser.svg", href: "/users", requiredPermission: "manage-registered-users" },
      { label: "Staff accounts", icon: "imgUserSquare.svg", href: "/staff", requiredPermission: "manage-staff-accounts" },
      { label: "Roles & Permissions", icon: "imgUserOctagon.svg", href: "/roles", requiredPermission: "manage-staff-accounts" },
    ],
  },
];

type SidebarProps = {
  activeItem?: string;
  onNavigate?: () => void;
  className?: string;
};

export default function Sidebar({ activeItem, onNavigate, className = "" }: SidebarProps) {
  const pathname = usePathname();
  const { can, isLoading } = usePermissions();

  const isItemActive = (item: { label: string; href: string }) => {
    if (activeItem) return item.label === activeItem;
    if (item.href === "#" || !pathname) return false;
    if (item.href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(item.href) || pathname.startsWith(`/dashboard${item.href}`);
  };

  const filteredSections = menuSections.map(section => ({
    ...section,
    items: section.items.filter(item => !item.requiredPermission || can(item.requiredPermission))
  })).filter(section => section.items.length > 0);

  return (
    <aside className={`flex h-svh flex-col overflow-y-auto border-r border-[#eef3f8] bg-white shadow-[0_1px_2px_-1px_rgba(12,74,110,0.16)] lg:sticky lg:top-0 lg:rounded-br-2xl ${className}`}>
      <div className="flex min-h-[74px] items-center justify-center border-b border-[#eef3f8]">
        <Image
          src={`${assetBase}imgD69B5048473640DcAe8C611Eb64B3D721Vectorized.svg`}
          alt="CityDeals"
          width={185}
          height={54}
          priority
          className="h-[54px] w-[185px]"
        />
      </div>

      <nav className="flex-1 px-4 pb-4 pt-5" aria-label="Dashboard navigation">
        {!isLoading && filteredSections.map((section) => (
          <section className="mb-4" key={section.title}>
            <h2 className="mb-2 px-4 text-xs font-medium leading-4 text-[#315576]">
              {section.title}
            </h2>
            <div className="grid gap-1">
              {section.items.map((item) => {
                const active = isItemActive(item);
                return (
                  <Link
                    className={
                      active
                        ? "flex min-h-10 items-center gap-2 rounded bg-[#0c4a6e] px-4 py-2 text-base leading-6 text-white [&_img]:brightness-0 [&_img]:invert"
                        : "flex min-h-10 items-center gap-2 rounded px-4 py-2 text-base leading-6 text-[#475569] no-underline hover:bg-slate-50"
                    }
                    href={item.href}
                    key={item.label}
                    onClick={onNavigate}
                  >
                    <Image src={`${assetBase}${item.icon}`} alt="" width={20} height={20} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </section>
        ))}
      </nav>

      <div className="border-t border-black/10 p-4">
        <Link
          href="/"
          className="flex min-h-14 items-center gap-3 rounded-lg p-2 text-[#475569] no-underline hover:bg-slate-50"
          onClick={() => {
            if (typeof window !== "undefined") {
              localStorage.removeItem("dashboard_access_token");
              localStorage.removeItem("dashboard_refresh_token");
              localStorage.removeItem("dashboard_user");
            }
            toast.info("You have been signed out.", { title: "Signed Out" });
            if (onNavigate) onNavigate();
          }}
        >
          <span className="grid size-10 place-items-center rounded-lg bg-slate-50">
            <Image src={`${assetBase}imgVuesaxLinearLogout.svg`} alt="" width={20} height={20} />
          </span>
          <span>
            <strong className="block text-sm font-medium leading-5 text-slate-900">Log Out</strong>
            <small className="block text-xs leading-4 text-slate-500">Exit admin panel</small>
          </span>
        </Link>
      </div>
    </aside>
  );
}
