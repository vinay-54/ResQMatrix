import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { alertsAPI } from '../../services/apiClient';
import { KEYS } from '../../lib/queryClient';

export const useAlerts = (params = {}) => useQuery({
  queryKey: KEYS.alerts.list(params),
  queryFn:  () => alertsAPI.getAll(params).then(r => r.data),
  refetchInterval: 30 * 1000,
});

export const useUnacknowledgedCount = () => {
  const { data } = useQuery({
    queryKey: [...KEYS.alerts.all(), 'unack-count'],
    queryFn:  () => alertsAPI.getAll({ acknowledged: false, limit: 1 })
                    .then(r => r.meta?.unacknowledged ?? 0),
    refetchInterval: 15 * 1000,
  });
  return data ?? 0;
};

export const useAcknowledgeAlert = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: alertsAPI.acknowledge,
    onMutate: async (alertId) => {
      await qc.cancelQueries({ queryKey: KEYS.alerts.all() });
      const snapshot = qc.getQueriesData({ queryKey: KEYS.alerts.all() });
      qc.setQueriesData({ queryKey: KEYS.alerts.all() }, (old) => {
        if (!Array.isArray(old)) return old;
        return old.map(a => a._id === alertId ? { ...a, acknowledged: true } : a);
      });
      return { snapshot };
    },
    onError: (_, __, ctx) => {
      ctx?.snapshot?.forEach(([key, data]) => qc.setQueryData(key, data));
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: KEYS.alerts.all() });
    },
  });
};

export const useAcknowledgeAll = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: alertsAPI.acknowledgeAll,
    onSuccess:  () => qc.invalidateQueries({ queryKey: KEYS.alerts.all() }),
  });
};

export const useDeleteAlert = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: alertsAPI.remove,
    onSuccess:  () => qc.invalidateQueries({ queryKey: KEYS.alerts.all() }),
  });
};
