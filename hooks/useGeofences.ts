import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { geofencesApi, type GeofenceItem } from "@/api/geofences";
import { queryKeys } from "@/api/queryKeys";

export function useGeofences() {
  return useQuery({
    queryKey: queryKeys.geofences.all,
    queryFn: geofencesApi.list,
  });
}

export function useUpdateGeofence() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: geofencesApi.update,
    onMutate: async ({ id, payload }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.geofences.all });
      const previous = queryClient.getQueryData<GeofenceItem[]>(queryKeys.geofences.all);

      queryClient.setQueryData<GeofenceItem[]>(queryKeys.geofences.all, (old) => {
        if (!old) return [];
        return old.map((item) => (item.id === id ? { ...item, ...payload } : item));
      });

      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.geofences.all, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.geofences.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.businesses.all });
    },
  });
}
