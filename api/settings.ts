import { apiClient } from './client';
export interface StoreLinkSettings { playStoreUrl: string; appStoreUrl: string; }
export interface RedemptionRules {
  cooldownValue: number;
  cooldownUnit: 'HOURS' | 'DAYS';
  dailyLimit: number;
}
export const settingsApi = {
  getStoreLinks: () => apiClient.get<unknown, StoreLinkSettings>('/settings/store-links'),
  updateStoreLinks: (payload: StoreLinkSettings) => apiClient.put<unknown, StoreLinkSettings>('/settings/store-links', payload),
  getRedemptionRules: () => apiClient.get<unknown, RedemptionRules>('/settings/redemption-rules'),
  updateRedemptionRules: (payload: RedemptionRules) => apiClient.put<unknown, RedemptionRules>('/settings/redemption-rules', payload),
};
