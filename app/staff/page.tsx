"use client";

import { useMemo, useState } from "react";
import { AxiosError } from "axios";
import { type StaffAccount } from "@/api/staff";
import Modal from "@/components/Modal";
import { toast } from "@/components/Toast";
import {
  useCreateStaff,
  useDeleteStaff,
  useStaffAccounts,
  useStaffRoles,
  useUpdateStaffRole,
  useUpdateStaffStatus,
} from "@/hooks/useStaff";

const DEFAULT_ROLES = [
  { key: "Super Administrator", name: "Super Administrator" },
  { key: "Administrator", name: "Administrator" },
  { key: "Manager", name: "Manager" },
  { key: "Editor", name: "Editor" },
  { key: "Viewer", name: "Viewer" },
];

function getMutationErrorMessage(error: unknown, fallback: string) {
  if (error instanceof AxiosError) {
    const message = error.response?.data?.message;
    if (Array.isArray(message)) return message.join(", ");
    if (typeof message === "string") return message;
    if (typeof error.response?.data?.error === "string") return error.response.data.error;
  }
  if (error instanceof Error) return error.message;
  return fallback;
}

export default function StaffAccountsPage() {
  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRoleFilter, setSelectedRoleFilter] = useState("ALL");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState("ALL");

  // Add staff modal state
  const [isAddStaffOpen, setIsAddStaffOpen] = useState(false);
  const [newStaffName, setNewStaffName] = useState("");
  const [newStaffEmail, setNewStaffEmail] = useState("");
  const [newStaffRole, setNewStaffRole] = useState("Administrator");

  // Delete modal state
  const [staffToDelete, setStaffToDelete] = useState<StaffAccount | null>(null);

  // Fetch staff accounts
  const {
    data: staffList = [],
    isLoading: isStaffLoading,
    isRefetching,
    refetch: refetchStaff,
  } = useStaffAccounts();

  // Fetch roles
  const { data: rolesData = [] } = useStaffRoles();

  // Combine roles list
  const availableRoles = useMemo(() => {
    if (rolesData.length > 0) {
      const names = rolesData.map((r) => r.name);
      // Ensure essential standard roles exist
      const combined = Array.from(
        new Set([...names, "Super Administrator", "Administrator", "Manager", "Editor", "Viewer"])
      );
      return combined;
    }
    return DEFAULT_ROLES.map((r) => r.name);
  }, [rolesData]);

  // Mutation: Create staff
  const createStaffMutation = useCreateStaff();

  // Mutation: Update staff role
  const updateRoleMutation = useUpdateStaffRole();

  // Mutation: Toggle staff status
  const updateStatusMutation = useUpdateStaffStatus();

  // Mutation: Delete staff
  const deleteStaffMutation = useDeleteStaff();

  // Filtered staff list
  const filteredStaff = useMemo(() => {
    return staffList.filter((staff) => {
      const matchesSearch =
        staff.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        staff.email.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesRole =
        selectedRoleFilter === "ALL" ||
        staff.roleKey.toLowerCase() === selectedRoleFilter.toLowerCase();

      const matchesStatus =
        selectedStatusFilter === "ALL" || staff.status === selectedStatusFilter;

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [staffList, searchTerm, selectedRoleFilter, selectedStatusFilter]);

  // Metrics
  const metrics = useMemo(() => {
    const total = staffList.length;
    const active = staffList.filter((s) => s.status === "ACTIVE").length;
    const admins = staffList.filter((s) =>
      s.roleKey.toLowerCase().includes("admin")
    ).length;
    const managers = staffList.filter((s) =>
      s.roleKey.toLowerCase().includes("manager")
    ).length;
    return { total, active, admins, managers };
  }, [staffList]);

  // Badge styles
  const getRoleBadgeStyle = (role: string) => {
    const lower = role.toLowerCase();
    if (lower.includes("super")) return "bg-purple-100 text-purple-800 border-purple-200";
    if (lower.includes("admin")) return "bg-blue-100 text-blue-800 border-blue-200";
    if (lower.includes("manager")) return "bg-emerald-100 text-emerald-800 border-emerald-200";
    if (lower.includes("editor") || lower.includes("moderator"))
      return "bg-amber-100 text-amber-800 border-amber-200";
    return "bg-slate-100 text-slate-700 border-slate-200";
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaffName.trim() || !newStaffEmail.trim()) {
      toast.warning("Please provide both name and email.", { title: "Missing Information" });
      return;
    }
    createStaffMutation.mutate(
      {
        fullName: newStaffName.trim(),
        email: newStaffEmail.trim(),
        roleKey: newStaffRole,
      },
      {
        onSuccess: () => {
          toast.success("Staff account created successfully!", { title: "Staff Added" });
          setIsAddStaffOpen(false);
          setNewStaffName("");
          setNewStaffEmail("");
          setNewStaffRole("Administrator");
        },
        onError: (error) => {
          toast.error(
            getMutationErrorMessage(error, "Failed to create staff account. Please try again."),
            { title: "Creation Failed" },
          );
        },
      },
    );
  };

  const handleUpdateRole = (id: string, roleKey: string) => {
    updateRoleMutation.mutate(
      { id, roleKey },
      {
        onSuccess: (_data, variables) => {
          const member = staffList.find((staff) => staff.id === variables.id);
          toast.success(`Updated ${member?.fullName || "staff"}'s role to "${variables.roleKey}"`, {
            title: "Role Updated",
          });
        },
        onError: () => {
          toast.error("Failed to update staff role", { title: "Error" });
        },
      },
    );
  };

  const handleUpdateStatus = (id: string, status: StaffAccount["status"]) => {
    updateStatusMutation.mutate(
      { id, status },
      {
        onSuccess: (_data, variables) => {
          const member = staffList.find((staff) => staff.id === variables.id);
          toast.success(
            `${member?.fullName || "Staff"} is now ${
              variables.status === "ACTIVE" ? "Active" : "Suspended"
            }`,
            { title: "Status Changed" },
          );
        },
        onError: () => {
          toast.error("Failed to update account status", { title: "Error" });
        },
      },
    );
  };

  const handleDeleteStaff = (id: string) => {
    deleteStaffMutation.mutate(id, {
      onSuccess: () => {
        toast.success("Staff account removed successfully", { title: "Staff Removed" });
        setStaffToDelete(null);
      },
      onError: (error) => {
        toast.error(getMutationErrorMessage(error, "Failed to remove staff account"), {
          title: "Deletion Failed",
        });
      },
    });
  };

  return (
    <div className="w-full px-4 py-4 sm:px-6 lg:px-8 lg:py-6">
      {/* Page Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Staff Accounts & Roles
            </h1>
            <span className="rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-semibold text-orange-700">
              Live Backend
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Manage admin users, team permissions, and assign operational roles across CityDeals.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => refetchStaff()}
            disabled={isRefetching}
            className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
            title="Refresh staff list"
          >
            <svg
              className={`size-4 ${isRefetching ? "animate-spin text-orange-500" : "text-slate-500"}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button
            onClick={() => setIsAddStaffOpen(true)}
            className="flex h-10 items-center gap-2 rounded-xl bg-orange-500 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-600 active:scale-95"
          >
            <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            <span>Add Staff</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Staff</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{metrics.total}</span>
            <span className="text-xs text-slate-400">members</span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Active Status</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-emerald-600">{metrics.active}</span>
            <span className="text-xs text-emerald-600/70">ready</span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Administrators</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-blue-600">{metrics.admins}</span>
            <span className="text-xs text-blue-600/70">full rights</span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Managers & Staff</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-amber-600">{metrics.managers}</span>
            <span className="text-xs text-amber-600/70">assigned</span>
          </div>
        </div>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between shadow-sm">
        <div className="relative flex-1">
          <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
            <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm text-slate-900 outline-none transition focus:border-orange-500 focus:bg-white"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Role Filter */}
          <select
            value={selectedRoleFilter}
            onChange={(e) => setSelectedRoleFilter(e.target.value)}
            className="h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-medium text-slate-700 outline-none transition focus:border-orange-500 focus:bg-white"
          >
            <option value="ALL">All Roles</option>
            {availableRoles.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatusFilter}
            onChange={(e) => setSelectedStatusFilter(e.target.value)}
            className="h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-medium text-slate-700 outline-none transition focus:border-orange-500 focus:bg-white"
          >
            <option value="ALL">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="SUSPENDED">Suspended</option>
          </select>
        </div>
      </div>

      {/* Main Content Area */}
      <section className="w-full rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {/* Loading Skeleton */}
        {isStaffLoading ? (
          <div className="divide-y divide-slate-100 p-6 space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center justify-between py-3 animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-xl bg-slate-200" />
                  <div className="space-y-2">
                    <div className="h-4 w-32 rounded bg-slate-200" />
                    <div className="h-3 w-48 rounded bg-slate-100" />
                  </div>
                </div>
                <div className="h-8 w-24 rounded-lg bg-slate-200" />
                <div className="h-8 w-32 rounded-lg bg-slate-100" />
                <div className="h-8 w-16 rounded-lg bg-slate-200" />
              </div>
            ))}
          </div>
        ) : filteredStaff.length === 0 ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="grid size-14 place-items-center rounded-2xl bg-orange-50 text-orange-500 mb-3">
              <svg className="size-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-base font-semibold text-slate-900">No staff accounts found</h3>
            <p className="mt-1 max-w-sm text-sm text-slate-500">
              {searchTerm || selectedRoleFilter !== "ALL" || selectedStatusFilter !== "ALL"
                ? "No team members matched your active filters. Try adjusting your search query."
                : "No staff members have been added yet. Click 'Add Staff' to create the first account."}
            </p>
            {searchTerm || selectedRoleFilter !== "ALL" || selectedStatusFilter !== "ALL" ? (
              <button
                onClick={() => {
                  setSearchTerm("");
                  setSelectedRoleFilter("ALL");
                  setSelectedStatusFilter("ALL");
                }}
                className="mt-4 text-sm font-medium text-orange-600 hover:text-orange-700"
              >
                Clear all filters
              </button>
            ) : (
              <button
                onClick={() => setIsAddStaffOpen(true)}
                className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600"
              >
                + Add First Staff Member
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/75 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    <th className="py-3.5 pl-6 pr-3">Staff Member</th>
                    <th className="px-3 py-3.5">Current Role</th>
                    <th className="px-3 py-3.5">Status</th>
                    <th className="px-3 py-3.5">Assign Role</th>
                    <th className="py-3.5 pl-3 pr-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white text-sm">
                  {filteredStaff.map((staff) => {
                    const isProtected = staff.roleKey === "Super Administrator";
                    return (
                      <tr
                        key={staff.id}
                        className="transition-colors hover:bg-slate-50/60"
                      >
                        {/* Member Column */}
                        <td className="py-4 pl-6 pr-3">
                          <div className="flex items-center gap-3">
                            <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-slate-800 text-sm font-bold text-white shadow-sm">
                              {staff.fullName ? staff.fullName.charAt(0).toUpperCase() : "U"}
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-slate-900 truncate">
                                {staff.fullName}
                              </p>
                              <p className="text-xs text-slate-500 truncate">
                                {staff.email}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Current Role Badge */}
                        <td className="px-3 py-4">
                          <span
                            className={`inline-flex items-center rounded-lg border px-2.5 py-1 text-xs font-semibold shadow-xs ${getRoleBadgeStyle(
                              staff.roleKey
                            )}`}
                          >
                            {staff.roleKey}
                          </span>
                        </td>

                        {/* Status Toggle Badge */}
                        <td className="px-3 py-4">
                          <button
                            type="button"
                            onClick={() =>
                              handleUpdateStatus(
                                staff.id,
                                staff.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE",
                              )
                            }
                            title="Click to toggle status"
                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium transition cursor-pointer ${
                              staff.status === "ACTIVE"
                                ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                                : "bg-red-50 text-red-700 hover:bg-red-100"
                            }`}
                          >
                            <span
                              className={`size-1.5 rounded-full ${
                                staff.status === "ACTIVE" ? "bg-emerald-500" : "bg-red-500"
                              }`}
                            />
                            {staff.status === "ACTIVE" ? "Active" : "Suspended"}
                          </button>
                        </td>

                        {/* Assign Role Select Dropdown */}
                        <td className="px-3 py-4">
                          {isProtected ? (
                            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 italic">
                              <svg className="size-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                              </svg>
                              Protected Role
                            </span>
                          ) : (
                            <div className="relative w-48">
                              <select
                                value={staff.roleKey}
                                onChange={(e) =>
                                  handleUpdateRole(staff.id, e.target.value)
                                }
                                disabled={updateRoleMutation.isPending}
                                className="h-9 w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-3 pr-8 text-xs font-medium text-slate-800 outline-none transition hover:border-slate-300 focus:border-orange-500 focus:bg-white"
                              >
                                {availableRoles
                                  .filter((r) => r !== "Super Administrator")
                                  .map((role) => (
                                    <option key={role} value={role}>
                                      {role}
                                    </option>
                                  ))}
                              </select>
                              <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400">
                                <svg className="size-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                </svg>
                              </div>
                            </div>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-4 pl-3 pr-6 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => setStaffToDelete(staff)}
                              className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-100 hover:border-red-300"
                              title="Delete staff account"
                            >
                              <svg className="size-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards View */}
            <div className="grid gap-3 p-3 lg:hidden">
              {filteredStaff.map((staff) => {
                const isProtected = staff.roleKey === "Super Administrator";
                return (
                  <article
                    key={staff.id}
                    className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-slate-800 text-sm font-bold text-white">
                          {staff.fullName ? staff.fullName.charAt(0).toUpperCase() : "U"}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900 truncate">
                            {staff.fullName}
                          </p>
                          <p className="text-xs text-slate-500 truncate">
                            {staff.email}
                          </p>
                        </div>
                      </div>

                      <span
                        className={`shrink-0 rounded-lg border px-2 py-0.5 text-xs font-semibold ${getRoleBadgeStyle(
                          staff.roleKey
                        )}`}
                      >
                        {staff.roleKey}
                      </span>
                    </div>

                    <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-xs">
                      <span className="text-slate-500">Account Status:</span>
                      <button
                        type="button"
                        onClick={() =>
                          handleUpdateStatus(
                            staff.id,
                            staff.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE",
                          )
                        }
                        className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 font-medium ${
                          staff.status === "ACTIVE"
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-red-50 text-red-700"
                        }`}
                      >
                        <span
                          className={`size-1.5 rounded-full ${
                            staff.status === "ACTIVE" ? "bg-emerald-500" : "bg-red-500"
                          }`}
                        />
                        {staff.status === "ACTIVE" ? "Active" : "Suspended"}
                      </button>
                    </div>

                    {/* Mobile Role Selector */}
                    <div className="rounded-xl bg-slate-50 p-2.5 space-y-1.5">
                      <label className="text-xs font-medium text-slate-500">
                        Change Assigned Role:
                      </label>
                      {isProtected ? (
                        <p className="text-xs text-slate-400 italic">Protected Role</p>
                      ) : (
                        <select
                          value={staff.roleKey}
                          onChange={(e) =>
                            handleUpdateRole(staff.id, e.target.value)
                          }
                          className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-900 outline-none"
                        >
                          {availableRoles
                            .filter((r) => r !== "Super Administrator")
                            .map((role) => (
                              <option key={role} value={role}>
                                {role}
                              </option>
                            ))}
                        </select>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => setStaffToDelete(staff)}
                      className="w-full rounded-xl border border-red-200 bg-red-50 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-100"
                    >
                      Delete Account
                    </button>
                  </article>
                );
              })}
            </div>
          </>
        )}
      </section>

      {/* Add Staff Modal */}
      <Modal
        isOpen={isAddStaffOpen}
        onClose={() => !createStaffMutation.isPending && setIsAddStaffOpen(false)}
        title="Add New Staff Member"
        subtitle="Create an internal staff account and assign permission roles"
        maxWidth="max-w-[480px]"
      >
        <form onSubmit={handleCreateSubmit} className="flex flex-col gap-4 mt-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Shakil Ahmed"
                value={newStaffName}
                onChange={(e) => setNewStaffName(e.target.value)}
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 text-sm text-slate-900 outline-none transition focus:border-orange-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Email Address <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                required
                placeholder="staff@citydeals.com"
                value={newStaffEmail}
                onChange={(e) => setNewStaffEmail(e.target.value)}
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 text-sm text-slate-900 outline-none transition focus:border-orange-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Assigned Role <span className="text-red-500">*</span>
              </label>
              <select
                value={newStaffRole}
                onChange={(e) => setNewStaffRole(e.target.value)}
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 text-sm font-medium text-slate-900 outline-none transition focus:border-orange-500 focus:bg-white"
              >
                {availableRoles
                  .filter((r) => r !== "Super Administrator")
                  .map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
              </select>
              <p className="mt-1.5 text-xs text-slate-500">
                Staff account will inherit the permissions assigned to this role in the Roles & Permissions matrix.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              disabled={createStaffMutation.isPending}
              onClick={() => setIsAddStaffOpen(false)}
              className="h-11 flex-1 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createStaffMutation.isPending}
              className="h-11 flex-1 rounded-xl bg-orange-500 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-600 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {createStaffMutation.isPending ? (
                <>
                  <svg className="size-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Creating...</span>
                </>
              ) : (
                "Save Staff Account"
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={Boolean(staffToDelete)}
        onClose={() => !deleteStaffMutation.isPending && setStaffToDelete(null)}
        title="Remove Staff Account"
        subtitle="Are you sure you want to delete this staff member?"
        maxWidth="max-w-[420px]"
      >
        <div className="py-2">
          {staffToDelete && (
            <div className="rounded-xl border border-red-100 bg-red-50/50 p-3.5 mb-4">
              <div className="flex items-center gap-3">
                <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-red-100 font-bold text-red-700 text-xs">
                  {staffToDelete.fullName.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-slate-900 text-sm truncate">
                    {staffToDelete.fullName}
                  </p>
                  <p className="text-xs text-slate-500 truncate">{staffToDelete.email}</p>
                </div>
              </div>
            </div>
          )}
          <p className="text-sm text-slate-600">
            This account will immediately lose all access to the dashboard. This action cannot be undone.
          </p>

          <div className="flex items-center gap-3 mt-6">
            <button
              type="button"
              disabled={deleteStaffMutation.isPending}
              onClick={() => setStaffToDelete(null)}
              className="h-10 flex-1 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={deleteStaffMutation.isPending}
              onClick={() => staffToDelete && handleDeleteStaff(staffToDelete.id)}
              className="h-10 flex-1 rounded-xl bg-red-600 text-sm font-semibold text-white shadow-sm hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {deleteStaffMutation.isPending ? (
                <span>Removing...</span>
              ) : (
                "Yes, Delete Account"
              )}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
