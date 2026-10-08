import { apiClient } from "./client";

export interface SearchResultItem {
  id: string;
  type: "User" | "Business" | "Coupon" | "Category" | "Staff";
  name: string;
  detail: string;
  status?: string;
  href: string;
}

export interface SearchResponse {
  query: string;
  results: SearchResultItem[];
  total: number;
}

export const searchApi = {
  global: async (q: string): Promise<SearchResponse> => {
    if (!q.trim()) return { query: "", results: [], total: 0 };
    return apiClient.get<unknown, SearchResponse>("/admin/search", { params: { q } });
  },
};
