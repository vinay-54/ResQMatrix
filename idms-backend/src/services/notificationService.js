const admin  = require('firebase-admin');
const axios  = require('axios');
const logger = require('../utils/logger');
const env    = require('../config/env');
const { User } = require('../models');

// ── Alert level config ────────────────────────────────────────────────────
const NOTIFICATION_CONFIG = {
  CRITICAL: {
    title:    '🚨 CRITICAL FLOOD ALERT — ResQMatrix',
    priority: 'high',
    sound:    'alarm',
    sendSMS:  true,
    channels: ['FCM', 'SMS'],
  },
  DANGER: {
    title:    '🔴 Flood Danger — ResQMatrix',
    priority: 'high',
    sound:    'default',
    sendSMS:  true,
    channels: ['FCM', 'SMS'],
  },
  WARNING: {
    title:    '⚠️ Flood Warning — ResQMatrix',
    priority: 'normal',
    sound:    'default',
    sendSMS:  false,
    channels: ['FCM'],
  },
  WATCH: {
    title:    'Flood Watch — ResQMatrix',
    priority: 'normal',
    sound:    null,
    sendSMS:  false,
    channels: ['FCM'],
  },
  SOS: {
    title:    '🆘 SOS RECEIVED — ResQMatrix',
    priority: 'high',
    sound:    'alarm',
    sendSMS:  true,
    channels: ['FCM', 'SMS'],
  },
};

// ── FCM: broadcast to topic (all citizens in area) ────────────────────────
exports.broadcastToTopic = async ({
  topic,
  level,
  title,
  body,
  data = {},
}) => {
  try {
    const cfg = NOTIFICATION_CONFIG[level] || NOTIFICATION_CONFIG.WARNING;

    const message = {
      topic,
      notification: {
        title: title || cfg.title,
        body,
      },
      data: {
        level,
        click_action: 'FLUTTER_NOTIFICATION_CLICK',
        url:          '/user/alerts',
        ...Object.fromEntries(
          Object.entries(data).map(([k, v]) => [k, String(v)])
        ),
      },
      android: {
        priority:     cfg.priority,
        notification: {
          sound:        cfg.sound || 'default',
          channelId:    `idms-${level.toLowerCase()}`,
          icon:         'ic_notification',
          color:        level === 'CRITICAL' || level === 'DANGER'
                          ? '#DC2626' : '#4868fc',
          priority:     cfg.priority === 'high' ? 'MAX' : 'DEFAULT',
          defaultSound: true,
        },
      },
      apns: {
        payload: {
          aps: {
            sound:    cfg.sound === 'alarm' ? 'alarm.wav' : 'default',
            badge:    1,
            'content-available': 1,
          },
        },
        headers: {
          'apns-priority': cfg.priority === 'high' ? '10' : '5',
        },
      },
      webpush: {
        headers:     { Urgency: cfg.priority === 'high' ? 'high' : 'normal' },
        notification: {
          title:      title || cfg.title,
          body,
          icon:       '/icons/icon-192x192.png',
          badge:      '/icons/badge-72x72.png',
          vibrate:    cfg.priority === 'high' ? [200, 100, 200, 100, 200] : [200],
          requireInteraction: level === 'CRITICAL' || level === 'DANGER',
          actions: [
            { action: 'view',   title: 'View Alert' },
            { action: 'dismiss', title: 'Dismiss'   },
          ],
        },
        fcmOptions: { link: '/user/alerts' },
      },
    };

    const response = await admin.messaging().send(message);
    logger.info('FCM topic broadcast sent', { topic, level, messageId: response });
    return { success: true, messageId: response };
  } catch (err) {
    logger.error('FCM topic broadcast failed', { topic, level, err: err.message });
    return { success: false, error: err.message };
  }
};

// ── FCM: send to specific device token ────────────────────────────────────
exports.sendToToken = async ({ token, level, title, body, data = {} }) => {
  try {
    const cfg = NOTIFICATION_CONFIG[level] || NOTIFICATION_CONFIG.WARNING;

    const message = {
      token,
      notification: { title: title || cfg.title, body },
      data: {
        level,
        ...Object.fromEntries(
          Object.entries(data).map(([k, v]) => [k, String(v)])
        ),
      },
      android: {
        priority: cfg.priority,
        notification: {
          sound:    cfg.sound || 'default',
          channelId: `idms-${level.toLowerCase()}`,
        },
      },
      webpush: {
        notification: {
          title: title || cfg.title,
          body,
          icon:  '/icons/icon-192x192.png',
          requireInteraction: cfg.priority === 'high',
        },
        fcmOptions: { link: '/user/alerts' },
      },
    };

    const response = await admin.messaging().send(message);
    return { success: true, messageId: response };
  } catch (err) {
    // Remove invalid/expired tokens automatically
    if (
      err.code === 'messaging/registration-token-not-registered' ||
      err.code === 'messaging/invalid-registration-token'
    ) {
      await User.updateOne({ fcmToken: token }, { $unset: { fcmToken: 1 } });
      logger.info('Removed invalid FCM token', { token: token.slice(0, 20) + '...' });
    }
    logger.error('FCM token send failed', { err: err.message });
    return { success: false, error: err.message };
  }
};

// ── FCM: send to all admins and coordinators ──────────────────────────────
exports.notifyAdmins = async ({ level, title, body, data = {} }) => {
  try {
    const adminUsers = await User.find({
      role:     { $in: ['admin', 'coordinator', 'operator'] },
      isActive: true,
      fcmToken: { $exists: true, $ne: null },
    }).select('fcmToken');

    if (adminUsers.length === 0) {
      logger.debug('No admin FCM tokens registered');
      return;
    }

    const tokens  = adminUsers.map(u => u.fcmToken);
    const results = await Promise.allSettled(
      tokens.map(token =>
        exports.sendToToken({ token, level, title, body, data })
      )
    );

    const succeeded = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
    logger.info('Admin notifications sent', { total: tokens.length, succeeded });
  } catch (err) {
    logger.error('notifyAdmins error', { err: err.message });
  }
};

// ── FCM: SOS-specific admin notification ─────────────────────────────────
exports.notifySOSToAdmins = async ({ incidentRef, lat, lng, reporterName, sourceType }) => {
  const title = '🆘 SOS RECEIVED';
  const body  = `${reporterName} needs rescue at (${lat.toFixed(4)}, ${lng.toFixed(4)})`;

  await Promise.all([
    exports.broadcastToTopic({
      topic: 'idms-admin-sos',
      level: 'SOS',
      title,
      body,
      data: { incidentRef, lat: String(lat), lng: String(lng), sourceType },
    }),
    exports.notifyAdmins({
      level: 'SOS',
      title,
      body,
      data: { incidentRef, url: `/rescue?sos=${incidentRef}` },
    }),
  ]);
};

// ── SMS via MSG91 ─────────────────────────────────────────────────────────
exports.sendSMS = async ({ mobile, level, message, variables = {} }) => {
  if (!env.MSG91_AUTH_KEY) {
    logger.warn('MSG91 not configured — SMS skipped');
    return { success: false, error: 'MSG91 not configured' };
  }

  const formattedMobile = mobile.startsWith('91')
    ? mobile
    : `91${mobile.replace(/\D/g, '')}`;

  try {
    const payload = {
      template_id: env.MSG91_TEMPLATE_ID,
      sender:      env.MSG91_SENDER_ID || 'RESQMX',
      short_url:   '0',
      mobiles:     formattedMobile,
      VAR1:        variables.var1 || level,
      VAR2:        variables.var2 || message.slice(0, 140),
      VAR3:        variables.var3 || 'ResQMatrix SVCE Tirupati',
    };

    const response = await axios.post(
      'https://api.msg91.com/api/v5/flow',
      payload,
      {
        headers: {
          authkey:       env.MSG91_AUTH_KEY,
          'Content-Type': 'application/json',
        },
        timeout: 8000,
      }
    );

    logger.info('SMS sent', {
      mobile: formattedMobile,
      level,
      requestId: response.data?.request_id,
    });
    return { success: true, requestId: response.data?.request_id };
  } catch (err) {
    logger.error('SMS send failed', { mobile: formattedMobile, err: err.message });
    return { success: false, error: err.message };
  }
};

// ── SMS: broadcast to all users with notifySMS enabled ───────────────────
exports.broadcastSMS = async ({ level, message }) => {
  try {
    const users = await User.find({
      notifySMS: true,
      isActive:  true,
      phone:     { $exists: true, $ne: null },
    }).select('phone name');

    if (users.length === 0) {
      logger.debug('No users subscribed to SMS alerts');
      return;
    }

    const BATCH_SIZE = 10;
    for (let i = 0; i < users.length; i += BATCH_SIZE) {
      const batch = users.slice(i, i + BATCH_SIZE);
      await Promise.allSettled(
        batch.map(user =>
          exports.sendSMS({
            mobile:    user.phone,
            level,
            message,
            variables: {
              var1: level,
              var2: message,
              var3: 'ResQMatrix SVCE Tirupati',
            },
          })
        )
      );
      if (i + BATCH_SIZE < users.length) {
        await new Promise(r => setTimeout(r, 500));
      }
    }

    logger.info('SMS broadcast complete', { userCount: users.length, level });
  } catch (err) {
    logger.error('broadcastSMS error', { err: err.message });
  }
};

// ── MAIN: process notification for an alert ───────────────────────────────
exports.sendNotification = async ({
  level,
  message,
  citizenMessage,
  channels,
  location,
  incidentRef,
  reporterName,
}) => {
  const results = [];

  try {
    // FCM
    if (channels.includes('FCM')) {
      const fcmResult = await exports.broadcastToTopic({
        topic: 'idms-alerts',
        level,
        body:  citizenMessage || message,
        data: {
          lat: String(location?.lat || ''),
          lng: String(location?.lng || ''),
          incidentRef: incidentRef || '',
        },
      });
      results.push({ channel: 'FCM_CITIZEN', ...fcmResult });

      if (incidentRef) {
        await exports.notifySOSToAdmins({
          incidentRef,
          lat:          location?.lat || 0,
          lng:          location?.lng || 0,
          reporterName: reporterName || 'Citizen',
          sourceType:   'SOS',
        });
        results.push({ channel: 'FCM_ADMIN', success: true });
      } else {
        if (['WARNING', 'DANGER', 'CRITICAL'].includes(level)) {
          await exports.notifyAdmins({
            level,
            body: message,
            data: { lat: String(location?.lat || ''), lng: String(location?.lng || '') },
          });
        }
      }
    }

    // SMS
    if (channels.includes('SMS')) {
      await exports.broadcastSMS({
        level,
        message: citizenMessage || message,
      });
      results.push({ channel: 'SMS', success: true });
    }
  } catch (err) {
    logger.error('sendNotification error', { err: err.message });
  }

  return results;
};
