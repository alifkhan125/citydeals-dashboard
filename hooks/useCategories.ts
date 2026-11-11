import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { categoriesApi, type Category } from "@/api/categories";
import { queryKeys } from "@/api/queryKeys";

export function useCategories() {
  return useQuery({
    queryKey: queryKeys.categories.all,
    queryFn: categoriesApi.list,
  });
}

export function useAdminCategories(params: { page: number; limit: number; search?: string; status?: string }) {
  return useQuery({ queryKey: ["admin-categories", params], queryFn: () => categoriesApi.adminList(params), placeholderData: (previous) => previous });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: categoriesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.all });
      queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
    },
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: categoriesApi.update,
    onMutate: async ({ id, payload }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.categories.all });
      await queryClient.cancelQueries({ queryKey: ["admin-categories"] });
      const previous = queryClient.getQueryData<Category[]>(queryKeys.categories.all);

      queryClient.setQueryData<Category[]>(queryKeys.categories.all, (old) => {
        if (!old) return [];
        return old.map((item) => (item.id === id ? { ...item, ...payload } : item));
      });

      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.categories.all, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.all });
      queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
    },
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: categoriesApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.all });
      queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
    },
  });
}

export function useBulkCategoryStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ ids, status }: { ids: string[]; status: Category["status"] }) => categoriesApi.bulkStatus(ids, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.all });
      queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
    },
  });
}

export function useBulkDeleteCategories() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => categoriesApi.bulkDelete(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.all });
      queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
    },
  });
}
