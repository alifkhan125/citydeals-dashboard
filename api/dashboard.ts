import { apiClient } from "./client";

export interface DashboardStats {
  businesses: number;
  registeredUsers: number;
  coupons: number;
  liveCoupons: number;
  couponsSaved: number;
  redemptions: number;
}

export interface TrendingCoupon {
  id: string;
  title: string;
  merchant?: { name: string };
  _count?: {
    savedBy: number;
    redemptions: number;
  };
}

export interface AreaRedemption {
  areaId: string;
  areaName: string;
  redemptions: number;
}

export interface DailyRedemptionPoint {
  time: string;
  count: number;
}

export interface DashboardOverview {
  stats: DashboardStats;
  trending: TrendingCoupon[];
  areaRedemptions: AreaRedemption[];
  dailyRedemptions: DailyRedemptionPoint[];
}

export const emptyDashboardStats: DashboardStats = {
  businesses: 0,
  registeredUsers: 0,
  coupons: 0,
  liveCoupons: 0,
  couponsSaved: 0,
  redemptions: 0,
};

export const dashboardApi = {
  stats: () => apiClient.get<unknown, DashboardStats>("/admin/dashboard/stats"),
  trendingCoupons: () =>
    apiClient.get<unknown, TrendingCoupon[]>("/admin/dashboard/trending-coupons"),
  redemptionsByArea: () =>
    apiClient.get<unknown, AreaRedemption[]>("/admin/dashboard/redemptions/by-area"),
  dailyRedemptions: () =>
    apiClient.get<unknown, DailyRedemptionPoint[]>("/admin/dashboard/redemptions/daily"),
  overview: async (): Promise<DashboardOverview> => {
    const [stats, trending, areaRedemptions, dailyRedemptions] = await Promise.all([
      dashboardApi.stats().catch(() => emptyDashboardStats),
      dashboardApi.trendingCoupons().catch(() => []),
      dashboardApi.redemptionsByArea().catch(() => []),
      dashboardApi.dailyRedemptions().catch(() => []),
    ]);

    return { stats, trending, areaRedemptions, dailyRedemptions };
  },
};
