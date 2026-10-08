import { apiClient } from "./client";

export interface ShareAnalyticsRow {
  couponId: string;
  couponTitle: string;
  couponCode?: string | null;
  businessName?: string | null;
  areaName?: string | null;
  channel: string;
  shares: number;
  opens: number;
  openRate: number;
  lastActivityAt: string;
}

export interface ShareChannelMetric {
  channel: string;
  shares: number;
  opens: number;
  openRate: number;
}

export interface ShareAnalyticsResponse {
  rows: ShareAnalyticsRow[];
  byChannel: ShareChannelMetric[];
  totalShares: number;
  totalOpens: number;
}

export const emptyShareAnalytics: ShareAnalyticsResponse = {
  rows: [],
  byChannel: [],
  totalShares: 0,
  totalOpens: 0,
};

export const shareAnalyticsApi = {
  summary: () => apiClient.get<unknown, ShareAnalyticsResponse>("/admin/share-analytics"),
};
