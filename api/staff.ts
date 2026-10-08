import { apiClient } from "./client";

export interface StaffAccount {
  id: string;
  fullName: string;
  email: string;
  roleKey: string;
  status: "ACTIVE" | "SUSPENDED" | "BANNED";
  createdAt: string;
  updatedAt?: string;
}

export interface StaffRole {
  id: string;
  name: string;
  key: string;
  permissions?: Record<string, boolean>;
}

export interface CreateStaffPayload {
  fullName: string;
  email: string;
  roleKey: string;
}

export const staffApi = {
  list: async (): Promise<StaffAccount[]> => {
    const data = await apiClient.get<unknown, StaffAccount[]>("/admin/staff");
    return Array.isArray(data) ? data : [];
  },
  roles: async (): Promise<StaffRole[]> => {
    const data = await apiClient.get<unknown, StaffRole[]>("/admin/roles");
    return Array.isArray(data) ? data : [];
  },
  create: (payload: CreateStaffPayload) => apiClient.post("/admin/staff", payload),
  updateRole: ({ id, roleKey }: { id: string; roleKey: string }) =>
    apiClient.patch(`/admin/staff/${id}/role`, { roleKey }),
  updateStatus: ({ id, status }: { id: string; status: StaffAccount["status"] }) =>
    apiClient.patch(`/admin/staff/${id}/status`, { status }),
  delete: (id: string) => apiClient.delete(`/admin/staff/${id}`),
};
