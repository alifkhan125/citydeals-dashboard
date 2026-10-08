import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { businessesApi, type BusinessItem } from "@/api/businesses";
import { queryKeys } from "@/api/queryKeys";

export function useBusinesses() {
  return useQuery({
    queryKey: queryKeys.businesses.all,
    queryFn: businessesApi.list,
  });
}

export function useBusinessCategories() {
  return useQuery({
    queryKey: queryKeys.categories.all,
    queryFn: businessesApi.categories,
  });
}

export function useBusinessAreas() {
  return useQuery({
    queryKey: queryKeys.areas.all,
    queryFn: businessesApi.areas,
  });
}

export function useCreateBusiness() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: businessesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.businesses.all });
    },
  });
}

export function useUpdateBusiness() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: businessesApi.update,
    onMutate: async ({ id, payload }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.businesses.all });
      const previous = queryClient.getQueryData<BusinessItem[]>(queryKeys.businesses.all);

      queryClient.setQueryData<BusinessItem[]>(queryKeys.businesses.all, (old) => {
        if (!old) return [];
        return old.map((item) => (item.id === id ? { ...item, ...payload } : item));
      });

      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.businesses.all, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.businesses.all });
    },
  });
}

export function useDeleteBusiness() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: businessesApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.businesses.all });
    },
  });
}
