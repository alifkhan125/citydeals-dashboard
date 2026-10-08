import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { usersApi, type AppUser } from "@/api/users";
import { queryKeys } from "@/api/queryKeys";

export function useUsers() {
  return useQuery({
    queryKey: queryKeys.users.all,
    queryFn: usersApi.list,
  });
}

export function useUpdateUserStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: usersApi.updateStatus,
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.users.all });
      const previousUsers = queryClient.getQueryData<AppUser[]>(queryKeys.users.all);

      queryClient.setQueryData<AppUser[]>(queryKeys.users.all, (old) => {
        if (!old) return old;
        return old.map((user) =>
          user.id === variables.id ? { ...user, status: variables.status } : user,
        );
      });

      return { previousUsers };
    },
    onError: (_error, _variables, context) => {
      if (context?.previousUsers) {
        queryClient.setQueryData(queryKeys.users.all, context.previousUsers);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
    },
  });
}
