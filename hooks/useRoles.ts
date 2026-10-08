import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { rolesApi } from "@/api/roles";
import { queryKeys } from "@/api/queryKeys";

export function useRoles() {
  return useQuery({
    queryKey: queryKeys.roles.all,
    queryFn: rolesApi.list,
  });
}

export function useUpdateRolePermissions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: rolesApi.updatePermissions,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.roles.all });
    },
  });
}
