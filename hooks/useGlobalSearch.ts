import { useQuery } from "@tanstack/react-query";
import { searchApi } from "@/api/search";

export function useGlobalSearch(query: string) {
  const normalized = query.trim();

  return useQuery({
    queryKey: ["search", normalized] as const,
    queryFn: () => searchApi.global(normalized),
    enabled: normalized.length >= 2,
    staleTime: 30_000,
  });
}
