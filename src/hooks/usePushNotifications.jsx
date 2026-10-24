import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import useAuthStore from '../store/useAuthStore';
import {
  requestNotificationPermission,
  onForegroundMessage,
  syncFCMToken,
} from '../services/pushNotifications';

const LEVEL_COLORS = {
  CRITICAL: '#DC2626',
  DANGER:   '#DC2626',
  WARNING:  '#EA580C',
  WATCH:    '#D97706',
  SOS:      '#DC2626',
};

export const usePushNotifications = () => {
  const navigate     = useNavigate();
  const isAuth       = useAuthStore(s => s.isAuthenticated);
  const [permission, setPermission] = useState(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );

  // ── Request permission on first login ───────────────────────────────
  const requestPermission = useCallback(async () => {
    const result = await requestNotificationPermission();
    if (result.success) {
      setPermission('granted');
      toast.success('Flood alerts enabled — you will be notified even when the app is closed');
    } else if (result.reason === 'denied') {
      setPermission('denied');
    }
    return result;
  }, []);

  // ── Foreground notification handler ─────────────────────────────────
  useEffect(() => {
    if (!isAuth || permission !== 'granted') return;

    const unsubscribe = onForegroundMessage((notification) => {
      const { title, body, level, url } = notification;
      const color = LEVEL_COLORS[level] || '#4868fc';

      toast(
        (t) => (
          <div
            onClick={() => { navigate(url); toast.dismiss(t.id); }}
            style={{ cursor: 'pointer' }}
          >
            <div style={{ fontWeight: 700, color, marginBottom: 4 }}>{title}</div>
            <div style={{ fontSize: 13, color: '#475569' }}>{body}</div>
            <div style={{ fontSize: 10, color: '#94A3B8', marginTop: 4 }}>
              Tap to view
            </div>
          </div>
        ),
        {
          duration:    level === 'CRITICAL' || level === 'DANGER' ? 10000 : 5000,
          style:       { border: `2px solid ${color}`, padding: '12px' },
          icon:        level === 'CRITICAL' ? '🚨' : level === 'DANGER' ? '🔴' : '⚠️',
        }
      );
    });

    return () => unsubscribe();
  }, [isAuth, permission, navigate]);

  // ── Sync FCM token on app load ───────────────────────────────────────
  useEffect(() => {
    if (isAuth && permission === 'granted') {
      syncFCMToken();
    }
  }, [isAuth]);

  return { permission, requestPermission };
};
