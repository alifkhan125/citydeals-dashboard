import { useQuery } from "@tanstack/react-query";
import { savedActivityApi } from "@/api/savedActivity";
import { queryKeys } from "@/api/queryKeys";

export function useSavedActivity(areaId: string) {
  return useQuery({
    queryKey: queryKeys.savedActivity.list(areaId),
    queryFn: () => savedActivityApi.list(areaId),
  });
}

export function useSavedActivityAreas() {
  return useQuery({
    queryKey: queryKeys.areas.all,
    queryFn: savedActivityApi.areas,
  });
}
