import { apiClient } from "./client";

export interface GeocodeResult {
  latitude: number;
  longitude: number;
  label: string;
  name?: string;
  city?: string;
  state?: string;
  country?: string;
  provider: string;
}

export const geocodingApi = {
  search: (query: string) =>
    apiClient.get<unknown, GeocodeResult>("/admin/geocode", {
      params: { q: query },
    }),
  suggestions: (query: string) =>
    apiClient.get<unknown, GeocodeResult[]>("/admin/geocode/suggestions", {
      params: { q: query },
    }),
};
