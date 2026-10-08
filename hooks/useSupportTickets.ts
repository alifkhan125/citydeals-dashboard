import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supportApi } from "@/api/support";
import { queryKeys } from "@/api/queryKeys";

export function useSupportTickets() {
  return useQuery({
    queryKey: queryKeys.support.tickets,
    queryFn: supportApi.listTickets,
  });
}

export function useUpdateSupportTicketStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: supportApi.updateStatus,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.support.tickets }),
  });
}

export function useReplySupportTicket() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: supportApi.reply,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.support.tickets }),
  });
}
