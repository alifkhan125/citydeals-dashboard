import { useQuery } from "@tanstack/react-query";
import { dashboardApi } from "@/api/dashboard";
import { queryKeys } from "@/api/queryKeys";

export function useDashboardOverview() {
  return useQuery({
    queryKey: queryKeys.dashboard.overview,
    queryFn: dashboardApi.overview,
  });
}
