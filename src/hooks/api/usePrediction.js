import { useQuery } from '@tanstack/react-query';
import { predictionAPI } from '../../services/apiClient';
import { KEYS } from '../../lib/queryClient';

export const usePrediction = (nodeId, params = { hours: 24 }) => useQuery({
  queryKey: KEYS.prediction.node(nodeId, params),
  queryFn:  () => predictionAPI.predictNode(nodeId, params).then(r => r.data),
  enabled:  !!nodeId,
  staleTime: 5 * 60 * 1000,
  gcTime:    10 * 60 * 1000,
});

export const useAllPredictions = (params = { hours: 24 }) => useQuery({
  queryKey: KEYS.prediction.all(params),
  queryFn:  () => predictionAPI.predictAll(params).then(r => r.data),
  staleTime: 5 * 60 * 1000,
});
