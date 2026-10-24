import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { campsAPI } from '../../services/apiClient';
import { KEYS } from '../../lib/queryClient';

export const useCamps = (params = {}) => useQuery({
  queryKey: KEYS.camps.all(params),
  queryFn:  () => campsAPI.getAll(params).then(r => r.data),
});

export const useCreateCamp = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: campsAPI.create,
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['camps'] }),
  });
};

export const useUpdateCamp = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => campsAPI.update(id, data),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['camps'] }),
  });
};

export const useDeleteCamp = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: campsAPI.remove,
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['camps'] }),
  });
};
