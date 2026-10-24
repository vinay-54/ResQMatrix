import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { operationsAPI } from '../../services/apiClient';
import { KEYS } from '../../lib/queryClient';

export const useOperations = (params = {}) => useQuery({
  queryKey: KEYS.operations.all(params),
  queryFn:  () => operationsAPI.getAll(params).then(r => r.data),
});

export const useOperation = (id) => useQuery({
  queryKey: KEYS.operations.detail(id),
  queryFn:  () => operationsAPI.getOne(id).then(r => r.data),
  enabled:  !!id,
});

export const useCreateOperation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: operationsAPI.create,
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['operations'] }),
  });
};

export const useUpdateOperation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => operationsAPI.update(id, data),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['operations'] }),
  });
};

export const useDeleteOperation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: operationsAPI.remove,
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['operations'] }),
  });
};
