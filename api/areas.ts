import { apiClient } from "./client";

export interface AreaItem {
  id: string;
  name: string;
  slug: string;
  city: string;
  state: string;
  latitude?: number | string | null;
  longitude?: number | string | null;
  radiusMeters?: number;
  qrCodeUrl?: string | null;
  _count?: {
    merchants: number;
    coupons: number;
  };
}

export interface AreaPayload {
  name: string;
  slug: string;
  city: string;
  state: string;
  latitude?: number;
  longitude?: number;
}

export interface AreaPageResult {
  items: AreaItem[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

export const areasApi = {
  list: async (): Promise<AreaItem[]> => {
    const data = await apiClient.get<unknown, AreaItem[]>("/areas");
    return Array.isArray(data) ? data : [];
  },
  adminList: async (params: { page: number; limit: number; search?: string; city?: string; state?: string }): Promise<AreaPageResult> =>
    apiClient.get("/areas/admin", { params }),
  adminIds: async (params: Record<string, string | number | undefined>): Promise<{ ids: string[] }> => apiClient.get("/areas/admin", { params: { ...params, idsOnly: "true" } }),
  create: (payload: AreaPayload) => apiClient.post("/areas", payload),
  update: ({ id, payload }: { id: string; payload: Partial<AreaPayload> }) =>
    apiClient.patch(`/areas/${id}`, payload),
  delete: (id: string) => apiClient.delete(`/areas/${id}`),
  bulkDelete: (ids: string[]) => apiClient.delete("/areas/admin/bulk", { data: { ids } }),
  regenerateQr: (id: string) => apiClient.post(`/areas/${id}/regenerate-qr`),
  regenerateAllQr: () => apiClient.post("/areas/regenerate-all-qr"),
};
