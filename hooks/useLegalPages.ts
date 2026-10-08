import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { legalApi } from "@/api/legal";
import { queryKeys } from "@/api/queryKeys";

export function useLegalPages() {
  return useQuery({
    queryKey: queryKeys.legal.pages,
    queryFn: legalApi.listPages,
  });
}

export function useSaveLegalPage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: legalApi.savePage,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.legal.pages }),
  });
}
