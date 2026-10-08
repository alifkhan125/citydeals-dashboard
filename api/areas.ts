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

export const areasApi = {
  list: async (): Promise<AreaItem[]> => {
    const data = await apiClient.get<unknown, AreaItem[]>("/areas");
    return Array.isArray(data) ? data : [];
  },
  create: (payload: AreaPayload) => apiClient.post("/areas", payload),
  update: ({ id, payload }: { id: string; payload: Partial<AreaPayload> }) =>
    apiClient.patch(`/areas/${id}`, payload),
  delete: (id: string) => apiClient.delete(`/areas/${id}`),
  regenerateQr: (id: string) => apiClient.post(`/areas/${id}/regenerate-qr`),
  regenerateAllQr: () => apiClient.post("/areas/regenerate-all-qr"),
};
