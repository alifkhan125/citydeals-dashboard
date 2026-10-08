"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "@/components/Toast";
import { useRoles, useUpdateRolePermissions } from "@/hooks/useRoles";

type RoleKey = "administrator" | "manager" | "editor" | "viewer";

interface PermissionItem {
  id: string;
  name: string;
  category: string;
}

const permissionList: PermissionItem[] = [
  {
    id: "manage-coupon-categories",
    name: "Manage coupon categories",
    category: "Directory",
  },
  {
    id: "manage-business-profiles",
    name: "Manage business profiles",
    category: "Content",
  },
  {
    id: "create-edit-coupons",
    name: "Create & edit coupons",
    category: "Content",
  },
  {
    id: "publish-coupons",
    name: "Publish coupons",
    category: "Content",
  },
  {
    id: "edit-app-pages",
    name: "Edit app pages (privacy, terms, FAQ)",
    category: "Content",
  },
  {
    id: "delete-content",
    name: "Delete content",
    category: "Content",
  },
  {
    id: "manage-registered-users",
    name: "Manage registered app users",
    category: "People",
  },
  {
    id: "manage-staff-accounts",
    name: "Manage staff accounts & roles",
    category: "People",
  },
];

const roles: { key: RoleKey; label: string }[] = [
  { key: "administrator", label: "Administrator" },
  { key: "manager", label: "Manager" },
  { key: "editor", label: "Editor" },
  { key: "viewer", label: "Viewer" },
];

const initialMatrix: Record<string, Record<RoleKey, boolean>> = {
  "manage-coupon-categories": { administrator: false, manager: false, editor: false, viewer: false },
  "manage-business-profiles": { administrator: false, manager: false, editor: false, viewer: false },
  "create-edit-coupons": { administrator: false, manager: false, editor: false, viewer: false },
  "publish-coupons": { administrator: false, manager: false, editor: false, viewer: false },
  "edit-app-pages": { administrator: false, manager: false, editor: false, viewer: false },
  "delete-content": { administrator: false, manager: false, editor: false, viewer: false },
  "manage-registered-users": { administrator: false, manager: false, editor: false, viewer: false },
  "manage-staff-accounts": { administrator: true, manager: false, editor: false, viewer: false },
};

export default function RolesAndPermissionsPage() {
  const { data: roleData = [], isLoading } = useRoles();
  const updateRolePermissionsMutation = useUpdateRolePermissions();
  const [matrix, setMatrix] = useState<Record<string, Record<RoleKey, boolean>>>(initialMatrix);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const rolePermissionsByKey = useMemo(() => {
    return new Map(roleData.map((role) => [role.key, role.permissions || {}]));
  }, [roleData]);

  useEffect(() => {
    if (roleData.length === 0) return;

    setMatrix(() => {
      const nextMatrix: Record<string, Record<RoleKey, boolean>> = { ...initialMatrix };

      permissionList.forEach((permission) => {
        nextMatrix[permission.id] = { ...initialMatrix[permission.id] };
        roles.forEach((role) => {
          nextMatrix[permission.id][role.key] =
            rolePermissionsByKey.get(role.key)?.[permission.id] ??
            initialMatrix[permission.id][role.key];
        });
      });

      return nextMatrix;
    });
  }, [roleData.length, rolePermissionsByKey]);

  const togglePermission = (permissionId: string, role: RoleKey) => {
    setMatrix((prev) => ({
      ...prev,
      [permissionId]: {
        ...prev[permissionId],
        [role]: !prev[permissionId]?.[role],
      },
    }));
  };

  const handleSave = async () => {
    try {
      await Promise.all(
        roles.map((role) => {
          const permissions = permissionList.reduce<Record<string, boolean>>((acc, permission) => {
            acc[permission.id] = !!matrix[permission.id]?.[role.key];
            return acc;
          }, {});

          return updateRolePermissionsMutation.mutateAsync({
            roleKey: role.key,
            permissions,
          });
        }),
      );

      setToastMessage("Roles & permissions saved successfully!");
      toast.success("Roles & permissions saved successfully!", { title: "Saved" });
      setTimeout(() => {
        setToastMessage(null);
      }, 3000);
    } catch {
      toast.error("Failed to save roles & permissions.", { title: "Save Failed" });
    }
  };

  const isSaving = updateRolePermissionsMutation.isPending;

  return (
    <div className="w-full px-4 py-4 sm:px-6 lg:px-8 lg:py-6">
      {/* Main Container Card */}
      <section className="w-full rounded-2xl border border-[#d1d5db] bg-white p-4 shadow-sm sm:p-6">
        {/* Header with Title, Description, and Save Button */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-xl font-semibold text-[#141a21]">Roles & permissions</h1>
            <p className="mt-1 text-sm leading-5 text-[#64748b]">
              Super administrators always have full access. Everything below controls what your other
              roles can do.
            </p>
          </div>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving || isLoading}
            className="inline-flex h-11 w-full shrink-0 cursor-pointer items-center justify-center rounded-xl bg-[#f97316] px-8 text-sm font-medium text-white shadow-sm transition-all hover:bg-[#ea580c] active:scale-95 disabled:opacity-70 sm:w-auto"
          >
            {isSaving ? "Saving..." : "Save"}
          </button>
        </div>

        <div className="mt-6 grid gap-3 lg:hidden">
          {permissionList.map((item) => (
            <article
              className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm"
              key={item.id}
            >
              <div>
                <h2 className="text-sm font-medium leading-5 text-slate-900">{item.name}</h2>
                <p className="mt-0.5 text-xs leading-4 text-slate-400">{item.category}</p>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {roles.map((role) => {
                  const isChecked = !!matrix[item.id]?.[role.key];

                  return (
                    <button
                      aria-pressed={isChecked}
                      className={
                        isChecked
                          ? "flex h-10 items-center justify-center gap-2 rounded-xl border border-[#10b981] bg-emerald-50 px-2 text-xs font-medium text-emerald-700"
                          : "flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-2 text-xs font-medium text-slate-600 hover:border-orange-200 hover:bg-orange-50"
                      }
                      key={role.key}
                      type="button"
                      onClick={() => togglePermission(item.id, role.key)}
                    >
                      <span
                        className={
                          isChecked
                            ? "grid size-4 place-items-center rounded border border-[#10b981] bg-[#10b981] text-white"
                            : "size-4 rounded border border-slate-300 bg-white"
                        }
                      >
                        {isChecked && (
                          <svg
                            className="size-3"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={3}
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </span>
                      {role.label}
                    </button>
                  );
                })}
              </div>
            </article>
          ))}
        </div>

        {/* Permissions Table Matrix */}
        <div className="mt-6 hidden overflow-x-auto rounded-xl border border-slate-200 lg:block">
          <div className="min-w-[850px]">
            {/* Table Header */}
            <div className="grid grid-cols-[minmax(280px,2fr)_repeat(4,minmax(130px,1fr))] items-center bg-[#f8fafc] text-sm font-medium text-slate-600">
              <div className="border-r border-slate-200 px-6 py-3.5">Person</div>
              <div className="border-r border-slate-200 px-6 py-3.5">Administrator</div>
              <div className="border-r border-slate-200 px-6 py-3.5">Manager</div>
              <div className="border-r border-slate-200 px-6 py-3.5">Editor</div>
              <div className="px-6 py-3.5">Viewer</div>
            </div>

            {/* Table Body */}
            <div className="divide-y divide-slate-100 bg-white">
              {permissionList.map((item) => (
                <div
                  key={item.id}
                  className="grid grid-cols-[minmax(280px,2fr)_repeat(4,minmax(130px,1fr))] items-center transition-colors hover:bg-slate-50/70"
                >
                  {/* Permission description */}
                  <div className="px-6 py-3.5">
                    <p className="text-sm font-normal text-slate-900 leading-5">{item.name}</p>
                    <span className="block text-xs text-slate-400 mt-0.5 leading-4">
                      {item.category}
                    </span>
                  </div>

                  {/* Role Checkboxes */}
                  {roles.map((role) => {
                    const isChecked = !!matrix[item.id]?.[role.key];
                    return (
                      <div key={role.key} className="px-6 py-3.5">
                        <button
                          type="button"
                          onClick={() => togglePermission(item.id, role.key)}
                          aria-label={`Toggle ${item.name} for ${role.label}`}
                          className={`flex size-5 items-center justify-center rounded-[5px] border transition-all cursor-pointer ${
                            isChecked
                              ? "border-[#10b981] bg-[#10b981] text-white shadow-sm"
                              : "border-slate-300 bg-white hover:border-slate-400"
                          }`}
                        >
                          {isChecked && (
                            <svg
                              className="size-3.5"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={3}
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Floating Save Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-xl bg-slate-900 px-5 py-3 text-sm text-white shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-200">
          <span className="grid size-5 place-items-center rounded-full bg-emerald-500 text-xs text-white">
            ✓
          </span>
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
