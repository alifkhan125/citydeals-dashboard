import { apiClient } from "./client";

export type BirthdayGiftItem = {
  id: string;
  title: string;
  description: string;
  terms?: string | null;
  category?: string | null;
  status: "ACTIVE" | "INACTIVE" | "EXPIRED";
  startsAt?: string | null;
  expiresAt?: string | null;
  claimLimit?: number | null;
  merchant: { id: string; name: string };
  coupon?: { id: string; title: string } | null;
  _count?: { claims: number };
};

export const birthdayGiftsApi = {
  list: (params: { page: number; limit: number; search?: string; status?: string }) => apiClient.get("/birthday-gifts/admin", { params }) as Promise<{ items: BirthdayGiftItem[]; meta: { page: number; limit: number; total: number; totalPages: number } }>,
  create: (payload: Record<string, unknown>) => apiClient.post("/birthday-gifts/admin", payload),
  update: (id: string, payload: Record<string, unknown>) => apiClient.patch(`/birthday-gifts/admin/${id}`, payload),
  remove: (id: string) => apiClient.delete(`/birthday-gifts/admin/${id}`),
  validate: (payload: { claimCode: string; merchantId: string }) => apiClient.post("/birthday-gifts/validate", payload),
};
