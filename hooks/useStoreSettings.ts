import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { settingsApi, StoreLinkSettings } from '@/api/settings';
const STORE_SETTINGS_KEY = ['settings', 'store-links'] as const;
export function useStoreSettings() { return useQuery({ queryKey: STORE_SETTINGS_KEY, queryFn: settingsApi.getStoreLinks }); }
export function useUpdateStoreSettings() {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: (payload: StoreLinkSettings) => settingsApi.updateStoreLinks(payload), onSuccess: (data) => queryClient.setQueryData(STORE_SETTINGS_KEY, data) });
}
