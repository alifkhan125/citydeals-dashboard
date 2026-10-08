import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { staffApi, type StaffAccount } from "@/api/staff";
import { queryKeys } from "@/api/queryKeys";

export function useStaffAccounts() {
  return useQuery({
    queryKey: queryKeys.staff.all,
    queryFn: staffApi.list,
  });
}

export function useStaffRoles() {
  return useQuery({
    queryKey: queryKeys.roles.all,
    queryFn: staffApi.roles,
  });
}

export function useCreateStaff() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: staffApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.staff.all });
    },
  });
}

export function useUpdateStaffRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: staffApi.updateRole,
    onMutate: async ({ id, roleKey }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.staff.all });
      const previous = queryClient.getQueryData<StaffAccount[]>(queryKeys.staff.all);

      queryClient.setQueryData<StaffAccount[]>(queryKeys.staff.all, (old) => {
        if (!old) return [];
        return old.map((member) => (member.id === id ? { ...member, roleKey } : member));
      });

      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.staff.all, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.staff.all });
    },
  });
}

export function useUpdateStaffStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: staffApi.updateStatus,
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.staff.all });
      const previous = queryClient.getQueryData<StaffAccount[]>(queryKeys.staff.all);

      queryClient.setQueryData<StaffAccount[]>(queryKeys.staff.all, (old) => {
        if (!old) return [];
        return old.map((member) => (member.id === id ? { ...member, status } : member));
      });

      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.staff.all, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.staff.all });
    },
  });
}

export function useDeleteStaff() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: staffApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.staff.all });
    },
  });
}
