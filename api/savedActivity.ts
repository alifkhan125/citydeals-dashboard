import { apiClient } from "./client";

export interface SavedActivityItem {
  id: string;
  createdAt: string;
  user: {
    id: string;
    fullName?: string | null;
    email?: string | null;
    phoneNumber?: string | null;
  };
  coupon: {
    id: string;
    title: string;
    couponCode?: string | null;
    imageUrl?: string | null;
    area?: {
      id: string;
      name: string;
      city: string;
    };
    merchant?: {
      id: string;
      name: string;
      logoUrl?: string | null;
    };
  };
}

export interface SavedActivityResponse {
  items: SavedActivityItem[];
  total: number;
  todayCount: number;
  thisWeekCount: number;
}

export interface SavedActivityAreaOption {
  id: string;
  name: string;
  city: string;
}

export const emptySavedActivity: SavedActivityResponse = {
  items: [],
  total: 0,
  todayCount: 0,
  thisWeekCount: 0,
};

export const savedActivityApi = {
  list: (areaId: string) => {
    const params = areaId !== "ALL" ? `?areaId=${areaId}` : "";
    return apiClient.get<unknown, SavedActivityResponse>(`/admin/saved-activity${params}`);
  },
  areas: async (): Promise<SavedActivityAreaOption[]> => {
    const data = await apiClient.get<unknown, SavedActivityAreaOption[]>("/areas");
    return Array.isArray(data) ? data : [];
  },
};
