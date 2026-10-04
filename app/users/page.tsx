"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/api/client";
import Modal from "@/components/Modal";
import { toast } from "@/components/Toast";

interface AppUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  joined: string;
  saved: number;
  redeemed: number;
  status: "Active" | "Suspended" | "Banned";
}

interface ApiUserRecord {
  id: string;
  fullName?: string;
  email?: string;
  phoneNumber?: string;
  createdAt: string | Date;
  status: string;
  _count?: {
    savedCoupons?: number;
    couponRedemptions?: number;
  };
}

export default function UsersPage() {
  const queryClient = useQueryClient();
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<AppUser | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const data = await apiClient.get('/admin/users');
      if (!Array.isArray(data)) return [];
      return data.map((u: ApiUserRecord): AppUser => ({
        id: u.id,
        name: u.fullName || "Unknown",
        email: u.email || "",
        phone: u.phoneNumber || "Not provided",
        joined: new Date(u.createdAt).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" }),
        saved: u._count?.savedCoupons || 0,
        redeemed: u._count?.couponRedemptions || 0,
        status: (u.status === "ACTIVE" ? "Active" : u.status === "SUSPENDED" ? "Suspended" : "Banned") as AppUser["status"],
      }));
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string, status: string }) => {
      return apiClient.patch(`/admin/users/${id}/status`, { status: status.toUpperCase() });
    },
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: ['users'] });
      const previousUsers = queryClient.getQueryData<AppUser[]>(['users']);
      
      queryClient.setQueryData<AppUser[]>(['users'], (old) => {
        if (!old) return old;
        return old.map(u => u.id === variables.id ? { ...u, status: variables.status as AppUser['status'] } : u);
      });
      
      if (selectedUser && selectedUser.id === variables.id) {
        setSelectedUser(prev => prev ? { ...prev, status: variables.status as AppUser['status'] } : null);
      }
      setActiveMenuId(null);
      
      return { previousUsers };
    },
    onError: (err: unknown, _variables, context) => {
      if (context?.previousUsers) {
        queryClient.setQueryData(['users'], context.previousUsers);
      }
      const errMsg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Failed to update status";
      toast.error(errMsg, { title: "Update Failed" });
      console.error("Failed to update status:", err);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  const handleToggleStatus = (id: string, newStatus: "Active" | "Suspended" | "Banned") => {
    updateStatusMutation.mutate({ id, status: newStatus });
  };

  const handleOpenDetails = (user: AppUser) => {
    setSelectedUser(user);
    setIsDetailsOpen(true);
    setActiveMenuId(null);
  };

  return (
    <div className="w-full px-4 py-4 sm:px-6 lg:px-8 lg:py-6">
      <section className="w-full rounded-2xl border border-[#d1d5db] bg-white p-3 sm:p-4">
        {/* Header Title */}
        <div className="px-1 py-1">
          <h1 className="m-0 text-2xl font-normal leading-8 text-slate-900 sm:text-base sm:leading-6">
            Registered app users
          </h1>
          <p className="mt-1 text-sm leading-5 text-[#475569]">
            Everyone who signed up in the mobile app. Suspend or ban an account to immediately cut off access.
          </p>
        </div>

        <div className="mt-4 grid gap-3 lg:hidden">
          {users.map((user) => (
            <article
              className="relative rounded-xl border border-slate-200 bg-white p-3 shadow-sm"
              key={user.id}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-3">
                    <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#0c4a6e] text-sm font-semibold text-white">
                      {user.name[0]}
                    </div>
                    <div className="min-w-0">
                      <strong className="block truncate text-sm font-medium leading-5 text-slate-900">
                        {user.name}
                      </strong>
                      <small className="block truncate text-xs leading-4 text-[#475569]">
                        {user.email}
                      </small>
                    </div>
                  </div>
                </div>

                <div className="relative shrink-0">
                  <button
                    type="button"
                    aria-label="User actions"
                    onClick={() =>
                      setActiveMenuId(activeMenuId === user.id ? null : user.id)
                    }
                    className="grid size-9 place-items-center rounded-lg border border-slate-300 bg-white text-lg font-bold leading-none text-[#0c4a6e] shadow-sm hover:border-[#0c4a6e] hover:bg-sky-50"
                  >
                    ⋮
                  </button>

                  {activeMenuId === user.id && (
                    <div className="absolute right-0 top-10 z-30 w-44 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl">
                      <button
                        type="button"
                        onClick={() => handleOpenDetails(user)}
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-medium text-slate-700 hover:bg-slate-50"
                      >
                        View Details
                      </button>

                      {user.status === "Active" ? (
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(user.id, "Suspended")}
                          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-medium text-amber-600 hover:bg-amber-50"
                        >
                          Suspend User
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(user.id, "Active")}
                          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-medium text-emerald-600 hover:bg-emerald-50"
                        >
                          Activate User
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleToggleStatus(user.id, "Banned")}
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-medium text-rose-600 hover:bg-rose-50"
                      >
                        Ban Account
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-3 grid gap-2 rounded-lg bg-slate-50 p-3 text-sm">
                <div className="flex justify-between gap-3">
                  <span className="text-slate-500">Phone</span>
                  <strong className="text-right font-medium text-slate-900">{user.phone}</strong>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-slate-500">Joined</span>
                  <strong className="text-right font-medium text-slate-900">{user.joined}</strong>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                <div className="rounded-lg border border-slate-200 bg-white p-2">
                  <span className="block text-[10px] font-medium uppercase text-slate-400">
                    Saved
                  </span>
                  <strong className="text-sm text-slate-900">{user.saved}</strong>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white p-2">
                  <span className="block text-[10px] font-medium uppercase text-slate-400">
                    Redeemed
                  </span>
                  <strong className="text-sm text-slate-900">{user.redeemed}</strong>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white p-2">
                  <span className="block text-[10px] font-medium uppercase text-slate-400">
                    Status
                  </span>
                  <span
                    className={`mt-1 inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${
                      user.status === "Active"
                        ? "bg-emerald-100 text-[#16a34a]"
                        : user.status === "Suspended"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-rose-100 text-rose-700"
                    }`}
                  >
                    {user.status}
                  </span>
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* Table Container */}
        <div className="mt-4 hidden overflow-x-auto rounded-lg border border-slate-200 lg:block">
          <div className="min-w-[880px]">
            {/* Table Header */}
            <div className="grid h-[55px] grid-cols-[minmax(180px,1.2fr)_minmax(200px,1.3fr)_140px_100px_140px_110px_70px] items-center bg-slate-100 text-sm leading-5 text-[#315576]">
              <div className="border-r border-slate-300 px-4">User</div>
              <div className="border-r border-slate-300 px-4">Contact</div>
              <div className="border-r border-slate-300 px-4">Joined</div>
              <div className="border-r border-slate-300 px-4">Saved</div>
              <div className="border-r border-slate-300 px-4">Redeemed</div>
              <div className="border-r border-slate-300 px-4">Status</div>
              <div className="px-4 text-center">Actions</div>
            </div>

            {/* Table Body */}
            {users.map((user) => (
              <div
                className="grid h-[58px] grid-cols-[minmax(180px,1.2fr)_minmax(200px,1.3fr)_140px_100px_140px_110px_70px] items-center border-b border-dashed border-slate-200 bg-white transition-colors hover:bg-slate-50/70 last:border-b-0"
                key={user.id}
              >
                {/* User column (Name & Email) */}
                <div className="min-w-0 px-4">
                  <strong className="block truncate text-sm font-normal leading-5 text-slate-900">
                    {user.name}
                  </strong>
                  <small className="block truncate text-xs leading-4 text-[#475569]">
                    {user.email}
                  </small>
                </div>

                {/* Contact column (Phone & Email) */}
                <div className="min-w-0 px-4">
                  <span className="block truncate text-sm font-normal leading-5 text-slate-900">
                    {user.phone}
                  </span>
                  <small className="block truncate text-xs leading-4 text-[#475569]">
                    {user.email}
                  </small>
                </div>

                {/* Joined column */}
                <div className="px-4 text-sm font-normal leading-5 text-slate-900">
                  {user.joined}
                </div>

                {/* Saved count */}
                <div className="px-4 text-sm font-normal leading-5 text-slate-900">
                  {user.saved}
                </div>

                {/* Redeemed bar + count */}
                <div className="flex items-center gap-3 px-4">
                  <span className="h-1.5 w-12 rounded-full bg-[#10b981]" />
                  <span className="text-sm font-normal leading-5 text-slate-900">
                    {user.redeemed}
                  </span>
                </div>

                {/* Status pill */}
                <div className="px-4">
                  <span
                    className={`inline-flex items-center rounded px-2.5 py-0.5 text-xs font-medium leading-5 ${
                      user.status === "Active"
                        ? "bg-emerald-100 text-[#16a34a]"
                        : user.status === "Suspended"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-rose-100 text-rose-700"
                    }`}
                  >
                    {user.status}
                  </span>
                </div>

                {/* Actions dropdown */}
                <div className="relative flex justify-center px-4">
                  <button
                    type="button"
                    aria-label="User actions"
                    onClick={() =>
                      setActiveMenuId(activeMenuId === user.id ? null : user.id)
                    }
                    className="flex size-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                  >
                    <svg
                      className="size-5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <circle cx="10" cy="4" r="1.5" />
                      <circle cx="10" cy="10" r="1.5" />
                      <circle cx="10" cy="16" r="1.5" />
                    </svg>
                  </button>

                  {/* Dropdown Menu */}
                  {activeMenuId === user.id && (
                    <div className="absolute right-6 top-8 z-30 w-44 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl animate-in fade-in zoom-in-95 duration-100">
                      <button
                        type="button"
                        onClick={() => handleOpenDetails(user)}
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-medium text-slate-700 hover:bg-slate-50"
                      >
                        <svg className="size-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        View Details
                      </button>

                      {user.status === "Active" ? (
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(user.id, "Suspended")}
                          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-medium text-amber-600 hover:bg-amber-50"
                        >
                          <svg className="size-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                          </svg>
                          Suspend User
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(user.id, "Active")}
                          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-medium text-emerald-600 hover:bg-emerald-50"
                        >
                          <svg className="size-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Activate User
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleToggleStatus(user.id, "Banned")}
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-medium text-rose-600 hover:bg-rose-50"
                      >
                        <svg className="size-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        Ban Account
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* User Details Modal */}
      {selectedUser && (
        <Modal
          isOpen={isDetailsOpen}
          onClose={() => setIsDetailsOpen(false)}
          title="User Profile"
          subtitle="Registered mobile app account details"
          maxWidth="max-w-[500px]"
        >
          <div className="flex flex-col gap-4">
            {/* User Header Summary Card */}
            <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="grid size-14 place-items-center rounded-2xl bg-[#0c4a6e] text-xl font-semibold text-white">
                {selectedUser.name[0]}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="m-0 truncate text-base font-semibold text-slate-900">
                    {selectedUser.name}
                  </h3>
                  <span
                    className={`rounded px-2.5 py-0.5 text-xs font-medium ${
                      selectedUser.status === "Active"
                        ? "bg-emerald-100 text-[#16a34a]"
                        : selectedUser.status === "Suspended"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-rose-100 text-rose-700"
                    }`}
                  >
                    {selectedUser.status}
                  </span>
                </div>
                <p className="mt-0.5 truncate text-xs text-slate-500">
                  {selectedUser.email}
                </p>
                <p className="mt-0.5 text-xs text-slate-500">
                  Joined {selectedUser.joined}
                </p>
              </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 p-3.5 text-center">
                <span className="text-xs text-[#475569]">Saved Coupons</span>
                <strong className="mt-1 block text-2xl font-semibold text-slate-900">
                  {selectedUser.saved}
                </strong>
              </div>
              <div className="rounded-2xl border border-slate-200 p-3.5 text-center">
                <span className="text-xs text-[#475569]">Redeemed Coupons</span>
                <strong className="mt-1 block text-2xl font-semibold text-[#16a34a]">
                  {selectedUser.redeemed}
                </strong>
              </div>
            </div>

            {/* Contact Information */}
            <div className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white p-4">
              <div className="flex justify-between border-b border-slate-100 pb-2 text-xs">
                <span className="text-slate-500">Phone Number</span>
                <strong className="font-medium text-slate-900">{selectedUser.phone}</strong>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-2 text-xs">
                <span className="text-slate-500">Email Address</span>
                <strong className="font-medium text-slate-900">{selectedUser.email}</strong>
              </div>
              <div className="flex justify-between text-xs pt-0.5">
                <span className="text-slate-500">Account Status</span>
                <strong className="font-medium text-slate-900">{selectedUser.status}</strong>
              </div>
            </div>

            {/* Action Buttons in Modal */}
            <div className="flex gap-3 pt-2">
              {selectedUser.status === "Active" ? (
                <button
                  type="button"
                  onClick={() => handleToggleStatus(selectedUser.id, "Suspended")}
                  className="h-11 flex-1 rounded-xl border border-amber-300 bg-amber-50 text-xs font-semibold text-amber-700 transition-colors hover:bg-amber-100"
                >
                  Suspend User
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleToggleStatus(selectedUser.id, "Active")}
                  className="h-11 flex-1 rounded-xl border border-emerald-300 bg-emerald-50 text-xs font-semibold text-emerald-700 transition-colors hover:bg-emerald-100"
                >
                  Activate User
                </button>
              )}

              <button
                type="button"
                onClick={() => handleToggleStatus(selectedUser.id, "Banned")}
                className="h-11 flex-1 rounded-xl border border-rose-200 bg-rose-50 text-xs font-semibold text-rose-700 transition-colors hover:bg-rose-100"
              >
                Ban Account
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
