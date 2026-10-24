import { useEffect, useRef } from 'react';
import { io }               from 'socket.io-client';
import { queryClient, KEYS } from '../lib/queryClient';
import useAuthStore          from '../store/useAuthStore';

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '')
  || 'http://localhost:5000';

let socket = null;

export const useSocket = (room = 'admin-room') => {
  const token = useAuthStore(s => s.token);

  useEffect(() => {
    if (!token) return;

    socket = io(SOCKET_URL, {
      auth:        { token },
      transports:  ['websocket'],
      reconnection: true,
      reconnectionDelay: 2000,
    });

    socket.on('connect', () => {
      socket.emit(`join:${room === 'admin-room' ? 'admin' : 'user'}`);
      console.log('[Socket.io] Connected to', room);
    });

    // ── Sensor events ─────────────────────────────────────────────────
    socket.on('sensor:live', () => {
      queryClient.invalidateQueries({ queryKey: KEYS.sensors.all() });
    });

    socket.on('sensor:offline', ({ nodeId }) => {
      queryClient.invalidateQueries({ queryKey: KEYS.sensors.detail(nodeId) });
      queryClient.invalidateQueries({ queryKey: KEYS.sensors.all() });
    });

    // ── Alert events ──────────────────────────────────────────────────
    socket.on('alert:new', (alert) => {
      queryClient.setQueriesData(
        { queryKey: KEYS.alerts.all() },
        (old) => Array.isArray(old) ? [alert, ...old] : [alert]
      );
    });

    socket.on('alert:acknowledged', () => {
      queryClient.invalidateQueries({ queryKey: KEYS.alerts.all() });
    });

    socket.on('alert:all-acknowledged', () => {
      queryClient.invalidateQueries({ queryKey: KEYS.alerts.all() });
    });

    // ── SOS events ────────────────────────────────────────────────────
    socket.on('sos:new', () => {
      queryClient.invalidateQueries({ queryKey: ['sos'] });
      queryClient.invalidateQueries({ queryKey: KEYS.alerts.all() });
    });

    socket.on('sos:updated', ({ incidentRef }) => {
      queryClient.invalidateQueries({ queryKey: KEYS.sos.detail(incidentRef) });
      queryClient.invalidateQueries({ queryKey: ['sos'] });
    });

    // ── Operation events ──────────────────────────────────────────────
    socket.on('operation:created', () => {
      queryClient.invalidateQueries({ queryKey: ['operations'] });
    });
    socket.on('operation:updated', () => {
      queryClient.invalidateQueries({ queryKey: ['operations'] });
    });

    // ── Team events ───────────────────────────────────────────────────
    socket.on('team:created', () => queryClient.invalidateQueries({ queryKey: ['teams'] }));
    socket.on('team:updated', () => queryClient.invalidateQueries({ queryKey: ['teams'] }));

    // ── Camp events ───────────────────────────────────────────────────
    socket.on('camp:created', () => queryClient.invalidateQueries({ queryKey: ['camps'] }));
    socket.on('camp:updated', () => queryClient.invalidateQueries({ queryKey: ['camps'] }));
    socket.on('camp:deleted', () => queryClient.invalidateQueries({ queryKey: ['camps'] }));

    // ── Drone events ──────────────────────────────────────────────────
    socket.on('drone:lowbattery', (data) => {
      console.warn('[Drone] Low battery warning', data);
    });

    socket.on('disconnect', () => {
      console.log('[Socket.io] Disconnected');
    });

    return () => {
      socket?.disconnect();
      socket = null;
    };
  }, [token, room]);

  return socket;
};
