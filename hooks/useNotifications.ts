import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { notificationsApi } from "@/api/notifications";
import { queryKeys } from "@/api/queryKeys";

export function useNotificationHistory() {
  return useQuery({
    queryKey: queryKeys.notifications.history,
    queryFn: notificationsApi.history,
  });
}

export function useNotificationAreas() {
  return useQuery({
    queryKey: queryKeys.areas.all,
    queryFn: notificationsApi.areas,
  });
}

export function useNotificationUsers() {
  return useQuery({
    queryKey: queryKeys.users.all,
    queryFn: notificationsApi.users,
  });
}

export function useSendNotification() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: notificationsApi.send,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.notifications.history }),
  });
}

export function useBirthdaySettings() {
  return useQuery({
    queryKey: ["notifications", "birthday-settings"],
    queryFn: notificationsApi.getBirthdaySettings,
  });
}

export function useUpdateBirthdaySettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: notificationsApi.updateBirthdaySettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications", "birthday-settings"] });
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.history });
    },
  });
}

export function useTriggerBirthdayCheck() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: notificationsApi.triggerBirthdayCheck,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.history });
    },
  });
}
