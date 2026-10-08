import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { authApi, type DashboardUser } from "@/api/auth";
import { queryKeys } from "@/api/queryKeys";
import { useAuthStore } from "@/store/useAuthStore";

export function useDashboardProfile() {
  const updateUser = useAuthStore((state) => state.updateUser);

  return useQuery({
    queryKey: queryKeys.auth.me,
    queryFn: async () => {
      const user = await authApi.me();
      updateUser(user);
      return user;
    },
  });
}

export function useUpdateDashboardProfile() {
  const queryClient = useQueryClient();
  const updateUser = useAuthStore((state) => state.updateUser);

  return useMutation({
    mutationFn: authApi.updateMe,
    onSuccess: (user: DashboardUser) => {
      updateUser(user);
      queryClient.setQueryData(queryKeys.auth.me, user);
    },
  });
}
