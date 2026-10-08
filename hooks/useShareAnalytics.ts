import { useQuery } from "@tanstack/react-query";
import { shareAnalyticsApi } from "@/api/shareAnalytics";
import { queryKeys } from "@/api/queryKeys";

export function useShareAnalytics() {
  return useQuery({
    queryKey: queryKeys.shareAnalytics.all,
    queryFn: shareAnalyticsApi.summary,
  });
}
