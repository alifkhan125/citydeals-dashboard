import { apiClient } from "./client";

export interface CouponItem {
  id: string;
  title: string;
  description: string;
  imageUrl?: string | null;
  couponCode?: string | null;
  couponLink?: string | null;
  redemptionLimit?: number | null;
  redemptionFrequency?: string;
  discussion?: string | null;
  terms?: string | null;
  status: "ACTIVE" | "DRAFT" | "PAUSED" | "EXPIRED";
  startsAt?: string | null;
  expiresAt?: string | null;
  areaId?: string;
  merchantId: string;
  categoryId?: string | null;
  isWhitelisted?: boolean;
  createdAt: string;
  updatedAt?: string;
  merchant?: {
    id: string;
    name: string;
    logoUrl?: string | null;
  };
  category?: {
    id: string;
    name: string;
    slug: string;
  };
  area?: {
    id: string;
    name: string;
    city: string;
  };
  views?: number;
  likes?: number;
  redemptions?: number;
}

export interface CouponOption {
  id: string;
  name: string;
}

export interface CouponPayload {
  title: string;
  description: string;
  merchantId: string;
  categoryId?: string;
  imageUrl?: string;
  couponCode?: string;
  redemptionLimit?: number;
  redemptionFrequency?: string;
  discussion?: string;
  terms?: string;
  expiresAt?: string;
  status: "ACTIVE" | "DRAFT" | "PAUSED" | "EXPIRED";
}

interface OptionRecord {
  id: string;
  name: string;
}

export const couponsApi = {
  list: async (): Promise<CouponItem[]> => {
    const data = await apiClient.get<unknown, CouponItem[]>("/coupons");
    return Array.isArray(data) ? data : [];
  },
  merchants: async (): Promise<CouponOption[]> => {
    const data = await apiClient.get<unknown, OptionRecord[]>("/merchants");
    return Array.isArray(data) ? data.map(({ id, name }) => ({ id, name })) : [];
  },
  categories: async (): Promise<CouponOption[]> => {
    const data = await apiClient.get<unknown, OptionRecord[]>("/categories");
    return Array.isArray(data) ? data.map(({ id, name }) => ({ id, name })) : [];
  },
  create: (payload: CouponPayload) => apiClient.post("/coupons", payload),
  update: ({ id, payload }: { id: string; payload: Partial<CouponPayload> }) =>
    apiClient.patch(`/coupons/${id}`, payload),
  delete: (id: string) => apiClient.delete(`/coupons/${id}`),
};
