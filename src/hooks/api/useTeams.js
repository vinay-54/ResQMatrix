import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { teamsAPI } from '../../services/apiClient';
import { KEYS } from '../../lib/queryClient';

export const useTeams = (params = {}) => useQuery({
  queryKey: KEYS.teams.all(params),
  queryFn:  () => teamsAPI.getAll(params).then(r => r.data),
  refetchInterval: 60 * 1000,
});

export const useCreateTeam = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: teamsAPI.create,
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['teams'] }),
  });
};

export const useUpdateTeam = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => teamsAPI.update(id, data),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['teams'] }),
  });
};

export const useDeleteTeam = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: teamsAPI.remove,
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['teams'] }),
  });
};
