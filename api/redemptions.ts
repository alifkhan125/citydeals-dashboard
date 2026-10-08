import { apiClient } from "./client";

export interface RedemptionItem {
  id: string;
  createdAt: string;
  user: {
    id: string;
    fullName: string;
    email?: string | null;
    phoneNumber?: string | null;
  };
  coupon: {
    id: string;
    title: string;
    couponCode?: string | null;
    imageUrl?: string | null;
    area?: { id: string; name: string; city: string };
    merchant?: { id: string; name: string; logoUrl?: string | null };
  };
}

export interface RedemptionAreaOption {
  id: string;
  name: string;
  city: string;
}

export interface RedemptionsResponse {
  items: RedemptionItem[];
  total: number;
  todayCount: number;
  thisWeekCount: number;
  thisMonthCount: number;
}

export const emptyRedemptions: RedemptionsResponse = {
  items: [],
  total: 0,
  todayCount: 0,
  thisWeekCount: 0,
  thisMonthCount: 0,
};

export const redemptionsApi = {
  list: (areaId: string) => {
    const params = areaId !== "ALL" ? `?areaId=${areaId}` : "";
    return apiClient.get<unknown, RedemptionsResponse>(`/admin/redemptions${params}`);
  },
  areas: async (): Promise<RedemptionAreaOption[]> => {
    const data = await apiClient.get<unknown, RedemptionAreaOption[]>("/areas");
    return Array.isArray(data) ? data : [];
  },
};
