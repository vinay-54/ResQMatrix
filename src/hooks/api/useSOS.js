import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sosAPI } from '../../services/apiClient';
import { KEYS } from '../../lib/queryClient';

export const useSOSIncidents = (params = {}) => useQuery({
  queryKey: KEYS.sos.all(params),
  queryFn:  () => sosAPI.getAll(params).then(r => r.data),
  refetchInterval: 30 * 1000,
});

export const useSOSIncident = (ref) => useQuery({
  queryKey: KEYS.sos.detail(ref),
  queryFn:  () => sosAPI.getOne(ref).then(r => r.data),
  enabled:  !!ref,
  refetchInterval: 5 * 1000,
});

export const useCreateSOS = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: sosAPI.create,
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['sos'] }),
  });
};

export const useUpdateSOSStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ ref, data }) => sosAPI.updateStatus(ref, data),
    onSuccess:  (_, { ref }) => {
      qc.invalidateQueries({ queryKey: KEYS.sos.detail(ref) });
      qc.invalidateQueries({ queryKey: ['sos'] });
    },
  });
};
