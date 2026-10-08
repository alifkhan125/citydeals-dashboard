import { apiClient } from "./client";

export interface AppUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  joined: string;
  saved: number;
  redeemed: number;
  status: "Active" | "Suspended" | "Banned";
}

interface ApiUserRecord {
  id: string;
  fullName?: string;
  email?: string;
  phoneNumber?: string;
  createdAt: string | Date;
  status: string;
  _count?: {
    savedCoupons?: number;
    couponRedemptions?: number;
  };
}

function mapUser(record: ApiUserRecord): AppUser {
  return {
    id: record.id,
    name: record.fullName || "Unknown",
    email: record.email || "",
    phone: record.phoneNumber || "Not provided",
    joined: new Date(record.createdAt).toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }),
    saved: record._count?.savedCoupons || 0,
    redeemed: record._count?.couponRedemptions || 0,
    status:
      record.status === "ACTIVE"
        ? "Active"
        : record.status === "SUSPENDED"
          ? "Suspended"
          : "Banned",
  };
}

export const usersApi = {
  list: async (): Promise<AppUser[]> => {
    const data = await apiClient.get<unknown, ApiUserRecord[]>("/admin/users");
    if (!Array.isArray(data)) return [];
    return data.map(mapUser);
  },
  updateStatus: ({ id, status }: { id: string; status: AppUser["status"] }) =>
    apiClient.patch(`/admin/users/${id}/status`, {
      status: status.toUpperCase(),
    }),
};
