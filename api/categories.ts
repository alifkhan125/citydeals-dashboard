import { apiClient } from "./client";

export interface Category {
  id: string;
  name: string;
  slug: string;
  iconUrl?: string | null;
  description?: string | null;
  status: "ACTIVE" | "INACTIVE";
  sortOrder?: number;
  _count?: {
    coupons: number;
    merchants: number;
  };
}

export interface CategoryPayload {
  name: string;
  slug: string;
  iconUrl?: string;
  description?: string;
  status: "ACTIVE" | "INACTIVE";
  sortOrder: number;
}

export const categoriesApi = {
  list: async (): Promise<Category[]> => {
    const data = await apiClient.get<unknown, Category[]>("/categories");
    return Array.isArray(data) ? data : [];
  },
  create: (payload: CategoryPayload) => apiClient.post("/categories", payload),
  update: ({ id, payload }: { id: string; payload: Partial<CategoryPayload> }) =>
    apiClient.patch(`/categories/${id}`, payload),
  delete: (id: string) => apiClient.delete(`/categories/${id}`),
};
