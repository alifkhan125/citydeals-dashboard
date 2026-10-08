import { apiClient } from "./client";
import type { BusinessItem } from "./businesses";

export interface GeofenceItem {
  id: string;
  business: string;
  area: string;
  city?: string;
  radiusMeters: number;
  latitude: number | string | null;
  longitude: number | string | null;
  status: "ACTIVE" | "INACTIVE";
  updatedAt?: string;
}

export interface UpdateGeofencePayload {
  radiusMeters: number;
  latitude?: number;
  longitude?: number;
  status?: "ACTIVE" | "INACTIVE";
}

function toGeofence(merchant: BusinessItem): GeofenceItem {
  return {
    id: merchant.id,
    business: merchant.name,
    area: merchant.area?.name ?? "Unassigned",
    city: merchant.area?.city,
    radiusMeters: merchant.radiusMeters ?? 3000,
    latitude: merchant.latitude ?? null,
    longitude: merchant.longitude ?? null,
    status: merchant.status,
    updatedAt: merchant.updatedAt,
  };
}

export const geofencesApi = {
  list: async (): Promise<GeofenceItem[]> => {
    const data = await apiClient.get<unknown, BusinessItem[]>("/merchants");
    return Array.isArray(data) ? data.map(toGeofence) : [];
  },
  update: ({ id, payload }: { id: string; payload: UpdateGeofencePayload }) =>
    apiClient.patch(`/merchants/${id}`, payload),
};
