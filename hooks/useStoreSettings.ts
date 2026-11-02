import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { settingsApi, StoreLinkSettings, RedemptionRules } from '@/api/settings';
const STORE_SETTINGS_KEY = ['settings', 'store-links'] as const;
export function useStoreSettings() { return useQuery({ queryKey: STORE_SETTINGS_KEY, queryFn: settingsApi.getStoreLinks }); }
export function useUpdateStoreSettings() {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: (payload: StoreLinkSettings) => settingsApi.updateStoreLinks(payload), onSuccess: (data) => queryClient.setQueryData(STORE_SETTINGS_KEY, data) });
}

const REDEMPTION_RULES_KEY = ['settings', 'redemption-rules'] as const;
export function useRedemptionRules() {
  return useQuery({ queryKey: REDEMPTION_RULES_KEY, queryFn: settingsApi.getRedemptionRules });
}
export function useUpdateRedemptionRules() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: RedemptionRules) => settingsApi.updateRedemptionRules(payload),
    onSuccess: (data) => queryClient.setQueryData(REDEMPTION_RULES_KEY, data),
  });
}
