import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { areasApi, type AreaItem } from "@/api/areas";
import { queryKeys } from "@/api/queryKeys";

export function useAreas() {
  return useQuery({
    queryKey: queryKeys.areas.all,
    queryFn: areasApi.list,
  });
}

export function useCreateArea() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: areasApi.create,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.areas.all }),
  });
}

export function useUpdateArea() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: areasApi.update,
    onMutate: async ({ id, payload }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.areas.all });
      const previous = queryClient.getQueryData<AreaItem[]>(queryKeys.areas.all);
      queryClient.setQueryData<AreaItem[]>(queryKeys.areas.all, (old) =>
        old ? old.map((area) => (area.id === id ? { ...area, ...payload } : area)) : [],
      );
      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) queryClient.setQueryData(queryKeys.areas.all, context.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: queryKeys.areas.all }),
  });
}

export function useDeleteArea() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: areasApi.delete,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.areas.all }),
  });
}

export function useRegenerateAreaQr() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: areasApi.regenerateQr,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.areas.all }),
  });
}

export function useRegenerateAllAreaQr() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: areasApi.regenerateAllQr,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.areas.all }),
  });
}
