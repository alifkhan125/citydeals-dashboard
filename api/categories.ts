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

export interface CategoryPageResult {
  items: Category[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

export const categoriesApi = {
  list: async (): Promise<Category[]> => {
    const data = await apiClient.get<unknown, Category[]>("/categories");
    return Array.isArray(data) ? data : [];
  },
  adminList: async (params: { page: number; limit: number; search?: string; status?: string }): Promise<CategoryPageResult> => apiClient.get("/categories/admin", { params }),
  adminIds: async (params: Record<string, string | number | undefined>): Promise<{ ids: string[] }> => apiClient.get("/categories/admin", { params: { ...params, idsOnly: "true" } }),
  create: (payload: CategoryPayload) => apiClient.post("/categories", payload),
  update: ({ id, payload }: { id: string; payload: Partial<CategoryPayload> }) =>
    apiClient.patch(`/categories/${id}`, payload),
  delete: (id: string) => apiClient.delete(`/categories/${id}`),
  bulkStatus: (ids: string[], status: Category["status"]) => apiClient.patch("/categories/admin/bulk-status", { ids, status }),
  bulkDelete: (ids: string[]) => apiClient.delete("/categories/admin/bulk", { data: { ids } }),
};
