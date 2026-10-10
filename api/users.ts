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
  locationName: string;
  locationCoordinates: string;
  hasLocation: boolean;
}

interface ApiUserRecord {
  id: string;
  fullName?: string;
  email?: string;
  phoneNumber?: string;
  createdAt: string | Date;
  status: string;
  latitude?: number | string | null;
  longitude?: number | string | null;
  area?: {
    id?: string;
    name?: string | null;
    city?: string | null;
    state?: string | null;
  } | null;
  _count?: {
    savedCoupons?: number;
    couponRedemptions?: number;
  };
}

function formatCoordinate(value: ApiUserRecord["latitude"]) {
  if (value === null || value === undefined || value === "") return null;
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return null;
  return numeric.toFixed(4);
}

function mapUser(record: ApiUserRecord): AppUser {
  const fallbackName = record.email?.split("@")[0] || record.phoneNumber || "Unknown User";
  const latitude = formatCoordinate(record.latitude);
  const longitude = formatCoordinate(record.longitude);
  const locationCoordinates = latitude && longitude ? `${latitude}, ${longitude}` : "";
  const locationName = [record.area?.name, record.area?.city || record.area?.state]
    .filter(Boolean)
    .join(", ");

  return {
    id: record.id,
    name: record.fullName?.trim() || fallbackName,
    email: record.email || "No email",
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
    locationName: locationName || (locationCoordinates ? "Current GPS" : "Not synced"),
    locationCoordinates,
    hasLocation: Boolean(locationName || locationCoordinates),
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
