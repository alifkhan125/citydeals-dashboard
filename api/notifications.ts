import { apiClient } from "./client";

export interface NotificationRecord {
  id: string;
  title: string;
  body: string;
  data?: {
    sendTo?: string;
    areaId?: string;
    scheduledAt?: string;
    repeat?: string;
  };
  readAt: string | null;
  createdAt: string;
  user?: {
    id: string;
    fullName: string;
    email?: string;
    area?: { id: string; name: string };
  };
}

export interface NotificationTargetArea {
  id: string;
  name: string;
  city: string;
}

export interface NotificationTargetUser {
  id: string;
  fullName: string;
  email?: string;
  phoneNumber?: string;
}

export interface SendNotificationPayload {
  title: string;
  body: string;
  sendTo: "ALL" | "AREA" | "USER";
  areaId?: string;
  userId?: string;
  scheduledAt?: string;
  repeat: "NONE" | "DAILY" | "WEEKLY";
}

export interface SendNotificationResponse {
  recipients?: number;
  created?: number;
  push?: {
    sent?: number;
    skipped?: number;
  };
}

export const notificationsApi = {
  history: async (): Promise<NotificationRecord[]> => {
    const res = await apiClient.get<unknown, { items?: NotificationRecord[] }>("/notifications/admin/history");
    return Array.isArray(res?.items) ? res.items : [];
  },
  areas: async (): Promise<NotificationTargetArea[]> => {
    const data = await apiClient.get<unknown, NotificationTargetArea[]>("/areas");
    return Array.isArray(data) ? data : [];
  },
  users: async (): Promise<NotificationTargetUser[]> => {
    const data = await apiClient.get<unknown, NotificationTargetUser[]>("/admin/users");
    return Array.isArray(data) ? data : [];
  },
  send: (payload: SendNotificationPayload) =>
    apiClient.post<unknown, SendNotificationResponse>("/notifications/send", payload),
};
