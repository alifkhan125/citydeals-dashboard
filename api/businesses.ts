import { apiClient } from "./client";

export interface BusinessItem {
  id: string;
  name: string;
  description?: string | null;
  titleText?: string | null;
  logoUrl?: string | null;
  categoryId?: string | null;
  areaId: string;
  address: string;
  phone?: string | null;
  email?: string | null;
  websiteUrl?: string | null;
  instagramUrl?: string | null;
  facebookUrl?: string | null;
  tiktokUrl?: string | null;
  radiusMeters?: number;
  status: "ACTIVE" | "INACTIVE";
  latitude?: number | string | null;
  longitude?: number | string | null;
  createdAt?: string;
  updatedAt?: string;
  area?: {
    id: string;
    name: string;
    city: string;
    state?: string;
  };
  category?: {
    id: string;
    name: string;
    slug?: string;
  } | null;
}

export interface CategoryOption {
  id: string;
  name: string;
}

export interface AreaOption {
  id: string;
  name: string;
  city: string;
  latitude?: number | string | null;
  longitude?: number | string | null;
}

export interface BusinessPayload {
  name: string;
  titleText?: string;
  categoryId?: string;
  areaId?: string;
  address: string;
  radiusMeters?: number;
  latitude?: number;
  longitude?: number;
  phone?: string;
  email?: string;
  websiteUrl?: string;
  instagramUrl?: string;
  facebookUrl?: string;
  tiktokUrl?: string;
  status: "ACTIVE" | "INACTIVE";
  logoUrl?: string;
}

export const businessesApi = {
  list: async (): Promise<BusinessItem[]> => {
    const data = await apiClient.get<unknown, BusinessItem[]>("/merchants");
    return Array.isArray(data) ? data : [];
  },
  categories: async (): Promise<CategoryOption[]> => {
    const data = await apiClient.get<unknown, CategoryOption[]>("/categories");
    return Array.isArray(data) ? data : [];
  },
  areas: async (): Promise<AreaOption[]> => {
    const data = await apiClient.get<unknown, AreaOption[]>("/areas");
    return Array.isArray(data) ? data : [];
  },
  create: (payload: BusinessPayload) => apiClient.post("/merchants", payload),
  update: ({ id, payload }: { id: string; payload: Partial<BusinessPayload> }) =>
    apiClient.patch(`/merchants/${id}`, payload),
  delete: (id: string) => apiClient.delete(`/merchants/${id}`),
};
