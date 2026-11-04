import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { couponsApi, type CouponItem } from "@/api/coupons";
import { queryKeys } from "@/api/queryKeys";
import { areasApi } from "@/api/areas";

export function useCoupons() {
  return useQuery({
    queryKey: queryKeys.coupons.all,
    queryFn: couponsApi.list,
  });
}

export function useAdminCoupons(params: {
  page: number;
  limit: number;
  search?: string;
  status?: string;
  merchantId?: string;
  categoryId?: string;
  areaId?: string;
  audience?: string;
}) {
  return useQuery({
    queryKey: ["admin-coupons", params],
    queryFn: () => couponsApi.adminList(params),
    placeholderData: (previous) => previous,
  });
}

export function useCouponMerchants() {
  return useQuery({
    queryKey: queryKeys.businesses.all,
    queryFn: couponsApi.merchants,
  });
}

export function useCouponCategories() {
  return useQuery({
    queryKey: queryKeys.categories.all,
    queryFn: couponsApi.categories,
  });
}

export function useCouponAreas() {
  return useQuery({
    queryKey: queryKeys.areas.all,
    queryFn: areasApi.list,
  });
}

export function useCreateCoupon() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: couponsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.coupons.all });
    },
  });
}

export function useUpdateCoupon() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: couponsApi.update,
    onMutate: async ({ id, payload }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.coupons.all });
      const previous = queryClient.getQueryData<CouponItem[]>(queryKeys.coupons.all);

      queryClient.setQueryData<CouponItem[]>(queryKeys.coupons.all, (old) => {
        if (!old) return [];
        return old.map((item) => (item.id === id ? { ...item, ...payload } : item));
      });

      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.coupons.all, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.coupons.all });
    },
  });
}

export function useDeleteCoupon() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: couponsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.coupons.all });
    },
  });
}

export function useBulkCouponStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ ids, status }: { ids: string[]; status: CouponItem["status"] }) => couponsApi.bulkStatus(ids, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-coupons"] }),
  });
}

export function useBulkDeleteCoupons() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => couponsApi.bulkDelete(ids),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-coupons"] }),
  });
}

export function useDuplicateCoupon() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => couponsApi.duplicate(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-coupons"] }),
  });
}

export function useNotifyNearbyCoupon() {
  return useMutation({
    mutationFn: couponsApi.notifyNearby,
  });
}
