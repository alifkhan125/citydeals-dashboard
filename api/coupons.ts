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
  status: "ACTIVE" | "ARCHIVED" | "PAUSED" | "EXPIRED";
  audience: "ALL_USERS" | "BIRTHDAY_USERS_ONLY" | "ALL_USERS_AND_BIRTHDAY_GIFT";
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
  status: "ACTIVE" | "ARCHIVED" | "PAUSED" | "EXPIRED";
  audience?: "ALL_USERS" | "BIRTHDAY_USERS_ONLY" | "ALL_USERS_AND_BIRTHDAY_GIFT";
}

export interface CouponReport {
  coupon: CouponItem & {
    merchant?: CouponItem['merchant'] & { address?: string; phone?: string | null; email?: string | null };
    area?: CouponItem['area'] & { state?: string };
  };
  metrics: {
    views: number; uniqueViewers: number; saves: number; redemptions: number;
    shares: number; shareOpens: number; conversionRate: number; saveRate: number;
    remainingRedemptions: number | null;
  };
  shareBreakdown: Array<{ channel: string; shares: number; opens: number; openRate: number }>;
  redemptions: Array<{ id: string; createdAt: string; user: { fullName?: string | null; email?: string | null; phoneNumber?: string | null } }>;
  generatedAt: string;
}

export interface CouponPageResult {
  items: CouponItem[];
  meta: { page: number; limit: number; total: number; totalPages: number };
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
  adminList: async (params: {
    page: number;
    limit: number;
    search?: string;
    status?: string;
    merchantId?: string;
    categoryId?: string;
    areaId?: string;
    audience?: string;
  }): Promise<CouponPageResult> => apiClient.get("/coupons/admin", { params }),
  adminIds: async (params: Record<string, string | number | undefined>): Promise<{ ids: string[] }> => apiClient.get("/coupons/admin", { params: { ...params, idsOnly: "true" } }),
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
  bulkStatus: (ids: string[], status: CouponItem["status"]) =>
    apiClient.patch("/coupons/admin/bulk-status", { ids, status }),
  bulkDelete: (ids: string[]) => apiClient.delete("/coupons/admin/bulk", { data: { ids } }),
  duplicate: (id: string) => apiClient.post(`/coupons/${id}/duplicate`),
  importCsv: async (csv: string): Promise<{ imported: number; failed: number; errors?: Array<{ row: number; message: string }> }> => (apiClient.post("/coupons/admin/import", { csv }) as any),
  notifyNearby: (id: string) => apiClient.post<{ sent: number; message: string }>(`/coupons/${id}/notify-nearby`),
  report: (id: string) => apiClient.get<unknown, CouponReport>(`/admin/coupons/${id}/report`),
};
