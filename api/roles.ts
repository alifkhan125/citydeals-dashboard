import { apiClient } from "./client";

export interface StaffRolePermission {
  id: string;
  name: string;
  key: string;
  permissions?: Record<string, boolean>;
}

export interface UpdateRolePermissionsPayload {
  roleKey: string;
  permissions: Record<string, boolean>;
}

export const rolesApi = {
  list: async (): Promise<StaffRolePermission[]> => {
    const data = await apiClient.get<unknown, StaffRolePermission[]>("/admin/roles");
    return Array.isArray(data) ? data : [];
  },
  updatePermissions: (payload: UpdateRolePermissionsPayload) =>
    apiClient.patch("/admin/roles/permissions", payload),
};
