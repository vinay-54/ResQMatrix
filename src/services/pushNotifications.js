import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { initializeApp, getApps, getApp } from 'firebase/app';
import apiClient from './apiClient';

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;

let messaging = null;

// Lazy-init messaging (must be in browser context)
const getMessagingInstance = () => {
  if (!messaging) {
    try {
      const app = getApps().length ? getApp() : null;
      if (!app) return null;
      messaging = getMessaging(app);
    } catch {
      return null;
    }
  }
  return messaging;
};

// ── Request permission and get FCM token ─────────────────────────────────
export const requestNotificationPermission = async () => {
  try {
    // Check browser support
    if (!('Notification' in window) || !('serviceWorker' in navigator)) {
      return { success: false, reason: 'not_supported' };
    }

    // Request permission
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      return { success: false, reason: 'denied' };
    }

    // Register service worker
    const registration = await navigator.serviceWorker.register(
      '/firebase-messaging-sw.js',
      { scope: '/' }
    );

    // Get FCM token
    const msg = getMessagingInstance();
    if (!msg) return { success: false, reason: 'messaging_unavailable' };

    const token = await getToken(msg, {
      vapidKey:                   VAPID_KEY,
      serviceWorkerRegistration:  registration,
    });

    if (!token) {
      return { success: false, reason: 'no_token' };
    }

    // Register token with backend
    await apiClient.post('/notifications/subscribe', {
      fcmToken: token,
      topics:   ['idms-alerts'],
    });

    // Store token locally
    localStorage.setItem('resqmatrix-fcm-token', token);

    return { success: true, token };
  } catch (err) {
    console.error('[Push] Permission request failed:', err);
    return { success: false, reason: err.message };
  }
};

// ── Handle foreground notifications ─────────────────────────────────────
export const onForegroundMessage = (callback) => {
  const msg = getMessagingInstance();
  if (!msg) return () => {};

  return onMessage(msg, (payload) => {
    const { title, body } = payload.notification || {};
    const data            = payload.data || {};

    callback({
      title:    title || 'ResQMatrix Alert',
      body:     body  || 'Update from flood monitoring network',
      level:    data.level   || 'WATCH',
      url:      data.url     || '/user/alerts',
      data,
    });
  });
};

// ── Check if token needs refresh ─────────────────────────────────────────
export const syncFCMToken = async () => {
  try {
    if (Notification.permission !== 'granted') return;
    const msg = getMessagingInstance();
    if (!msg) return;

    const newToken   = await getToken(msg, { vapidKey: VAPID_KEY });
    const savedToken = localStorage.getItem('resqmatrix-fcm-token');

    if (newToken && newToken !== savedToken) {
      await apiClient.patch('/notifications/fcm-token', { fcmToken: newToken });
      localStorage.setItem('resqmatrix-fcm-token', newToken);
    }
  } catch (err) {
    console.error('[Push] Token sync failed:', err);
  }
};
