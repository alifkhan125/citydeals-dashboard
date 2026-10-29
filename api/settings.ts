import { apiClient } from './client';
export interface StoreLinkSettings { playStoreUrl: string; appStoreUrl: string; }
export const settingsApi = {
  getStoreLinks: () => apiClient.get<unknown, StoreLinkSettings>('/settings/store-links'),
  updateStoreLinks: (payload: StoreLinkSettings) => apiClient.put<unknown, StoreLinkSettings>('/settings/store-links', payload),
};
