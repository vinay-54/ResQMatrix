import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { sensorsAPI } from '../../services/apiClient';
import { listenToNodes } from '../../services/firebaseClient';
import { KEYS, queryClient as qc } from '../../lib/queryClient';

// ── Query: all sensor nodes (with Firebase real-time overlay) ─────────────
export const useSensors = (params = {}) => {
  const query = useQuery({
    queryKey: KEYS.sensors.list(params),
    queryFn:  () => sensorsAPI.getAll(params).then(r => r.data),
    staleTime: 60 * 1000,
  });

  // Firebase overlay — updates individual nodes in cache without refetch
  useEffect(() => {
    const unsub = listenToNodes((liveNodes) => {
      qc.setQueryData(KEYS.sensors.list(params), (old) => {
        if (!old) return old;
        return old.map(node => {
          const live = liveNodes.find(n => n.nodeId === node.nodeId);
          if (!live) return node;
          return {
            ...node,
            alertLevel:  live.alertLevel  ?? node.alertLevel,
            status:      live.status      ?? node.status,
            latest: {
              ...node.latest,
              waterLevel:  live.waterLevel,
              temperature: live.temperature,
              humidity:    live.humidity,
              battery:     live.battery,
              commLayer:   live.commLayer,
              receivedAt:  new Date(live.updatedAt),
            },
          };
        });
      });
    });
    return () => unsub();
  }, []);

  return query;
};

// ── Query: single node ────────────────────────────────────────────────────
export const useSensor = (nodeId) => useQuery({
  queryKey: KEYS.sensors.detail(nodeId),
  queryFn:  () => sensorsAPI.getOne(nodeId).then(r => r.data),
  enabled:  !!nodeId,
});

// ── Query: sensor readings for chart ─────────────────────────────────────
export const useSensorReadings = (nodeId, params = {}) => useQuery({
  queryKey: KEYS.sensors.readings(nodeId, params),
  queryFn:  () => sensorsAPI.getReadings(nodeId, params).then(r => r.data),
  enabled:  !!nodeId,
  staleTime: 2 * 60 * 1000,
});

// ── Query: dashboard summary ──────────────────────────────────────────────
export const useSensorSummary = () => useQuery({
  queryKey: KEYS.sensors.summary(),
  queryFn:  () => sensorsAPI.getSummary().then(r => r.data),
  staleTime: 30 * 1000,
  refetchInterval: 60 * 1000,
});

// ── Mutations ─────────────────────────────────────────────────────────────
export const useCreateSensor = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: sensorsAPI.create,
    onSuccess:  () => {
      qc.invalidateQueries({ queryKey: KEYS.sensors.all() });
      qc.invalidateQueries({ queryKey: KEYS.sensors.summary() });
    },
  });
};

export const useUpdateSensor = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ nodeId, data }) => sensorsAPI.update(nodeId, data),
    onSuccess:  (_, { nodeId }) => {
      qc.invalidateQueries({ queryKey: KEYS.sensors.all() });
      qc.invalidateQueries({ queryKey: KEYS.sensors.detail(nodeId) });
    },
  });
};

export const useDeleteSensor = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: sensorsAPI.remove,
    onSuccess:  () => {
      qc.invalidateQueries({ queryKey: KEYS.sensors.all() });
    },
  });
};
