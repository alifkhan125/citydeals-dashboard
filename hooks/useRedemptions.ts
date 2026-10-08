import { useQuery } from "@tanstack/react-query";
import { redemptionsApi } from "@/api/redemptions";
import { queryKeys } from "@/api/queryKeys";

export function useRedemptions(areaId: string) {
  return useQuery({
    queryKey: queryKeys.redemptions.list(areaId),
    queryFn: () => redemptionsApi.list(areaId),
  });
}

export function useRedemptionAreas() {
  return useQuery({
    queryKey: queryKeys.areas.all,
    queryFn: redemptionsApi.areas,
  });
}
