import type { Metadata } from "next";
import "./globals.css";
import DashboardShell from "@/components/DashboardShell";
import QueryProvider from "@/providers/QueryProvider";

export const metadata: Metadata = {
  title: "CityDeals | Admin Dashboard",
  description: "Manage CityDeals businesses, coupons, locations and redemptions.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <QueryProvider>
          <DashboardShell>{children}</DashboardShell>
        </QueryProvider>
      </body>
    </html>
  );
}
