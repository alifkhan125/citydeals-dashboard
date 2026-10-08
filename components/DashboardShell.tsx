"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { useAuthStore } from "@/store/useAuthStore";

export default function DashboardShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const hydrateFromStorage = useAuthStore((state) => state.hydrateFromStorage);

  useEffect(() => {
    hydrateFromStorage();
  }, [hydrateFromStorage]);

  // If on root sign-in page, render clean without dashboard layout
  if (pathname === "/" || pathname === "/signin") {
    return <>{children}</>;
  }

  return (
    <div className="min-h-svh bg-white text-slate-900 lg:grid lg:grid-cols-[272px_minmax(0,1fr)]">
      <Sidebar className="hidden lg:flex" />

      {isSidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            className="absolute inset-0 bg-slate-900/35"
            type="button"
            aria-label="Close navigation"
            onClick={() => setIsSidebarOpen(false)}
          />
          <Sidebar
            className="relative z-10 w-[min(86vw,300px)]"
            onNavigate={() => setIsSidebarOpen(false)}
          />
        </div>
      )}

      <section className="flex min-w-0 flex-col">
        <Header onMenuClick={() => setIsSidebarOpen(true)} />
        <main className="min-w-0 flex-1 overflow-x-hidden">{children}</main>
      </section>
    </div>
  );
}
