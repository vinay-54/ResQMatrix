import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { dronesAPI } from '../../services/apiClient';
import { listenToDrone } from '../../services/firebaseClient';
import { KEYS, queryClient as qc } from '../../lib/queryClient';

export const useDrones = () => {
  const query = useQuery({
    queryKey: KEYS.drones.all(),
    queryFn:  () => dronesAPI.getAll().then(r => r.data),
  });

  // Firebase overlay for DR-001 telemetry
  useEffect(() => {
    const unsub = listenToDrone('DR-001', (live) => {
      if (!live) return;
      qc.setQueryData(KEYS.drones.all(), (old) => {
        if (!old) return old;
        return old.map(d => d.droneId === 'DR-001'
          ? {
              ...d,
              status: live.status ?? d.status,
              telemetry: {
                ...d.telemetry,
                lat:             live.lat,
                lng:             live.lng,
                altitude:        live.altitude,
                batteryPct:      live.batteryPct,
                flightMode:      live.flightMode,
                connectionStatus:live.connectionStatus,
                groundSpeed:     live.groundSpeed,
                heading:         live.heading,
                lastSeen:        live.updatedAt
                  ? new Date(live.updatedAt) : d.telemetry?.lastSeen,
              },
            }
          : d
        );
      });
    });
    return () => unsub();
  }, []);

  return query;
};

export const useDrone = (droneId) => useQuery({
  queryKey: KEYS.drones.detail(droneId),
  queryFn:  () => dronesAPI.getOne(droneId).then(r => r.data),
  enabled:  !!droneId,
});

export const useCreateDrone = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: dronesAPI.create,
    onSuccess:  () => qc.invalidateQueries({ queryKey: KEYS.drones.all() }),
  });
};

export const useUpdateDrone = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => dronesAPI.update(id, data),
    onSuccess:  () => qc.invalidateQueries({ queryKey: KEYS.drones.all() }),
  });
};

export const useDeleteDrone = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: dronesAPI.remove,
    onSuccess:  () => qc.invalidateQueries({ queryKey: KEYS.drones.all() }),
  });
};
