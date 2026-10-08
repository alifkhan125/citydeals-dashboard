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
