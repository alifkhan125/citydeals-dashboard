import { useRoles } from "./useRoles";
import { useAuthStore } from "@/store/useAuthStore";
import { useMemo } from "react";

/**
 * Returns a function `can(permissionId)` that checks if the currently
 * logged-in staff user has a given permission based on their role.
 *
 * Rules:
 * - Users with role 'ADMIN' whose roleKey is 'administrator' or
 *   'super-administrator' → can do everything.
 * - All others → check StaffRole.permissions[permissionId] === true.
 *
 * Usage:
 *   const { can, isLoading } = usePermissions();
 *   if (!can('manage-staff-accounts')) return <Forbidden />;
 */
export function usePermissions() {
  const user = useAuthStore((s) => s.user);
  const { data: roles = [], isLoading } = useRoles();

  const can = useMemo(() => {
    return (permissionId: string): boolean => {
      if (!user) return false;

      // Non-ADMIN users (mobile app users, advertisers) are not subject to
      // staff permissions in the dashboard context.
      if (user.role !== "ADMIN") return false;

      // Find this user's staff role by matching the staffRoleKey stored on user
      // The staffRoleKey is the normalised key like "administrator", "manager" etc.
      // We derive it from the roles list using the user's role label stored at login.
      // If the user has no staffRoleKey set, fall back to checking all roles.
      const staffRoleKey: string | undefined = (user as any).staffRoleKey;

      if (!staffRoleKey) {
        // No staffRoleKey → this is a top-level ADMIN with no StaffAccount
        // (e.g. the super admin who registered with role=ADMIN in User table)
        return true;
      }

      const normalised = staffRoleKey.toLowerCase().replace(/\s+/g, "-");

      // Super-admin / administrator bypass
      if (normalised === "super-administrator" || normalised === "administrator") {
        return true;
      }

      const role = roles.find((r) => r.key === normalised);
      if (!role?.permissions) return false;

      return role.permissions[permissionId] === true;
    };
  }, [user, roles]);

  return { can, isLoading };
}
