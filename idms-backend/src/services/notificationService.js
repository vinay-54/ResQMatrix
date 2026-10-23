const logger = require('../utils/logger');
const env    = require('../config/env');

/**
 * Send FCM push notification and/or SMS alert
 * Called by alert engine when level crosses WARNING or above
 */
exports.sendNotification = async ({ level, message, citizenMessage, channels, location }) => {
  const results = [];

  // ── FCM Push Notification ─────────────────────────────────────────────
  if (channels.includes('FCM')) {
    try {
      const admin = require('firebase-admin');

      const fcmMessage = {
        topic:        'idms-alerts',  // subscribers to this topic get the alert
        notification: {
          title: `⚠️ IDMS ${level} Alert`,
          body:  citizenMessage || message,
        },
        data: {
          level,
          lat: location?.lat?.toString() || '',
          lng: location?.lng?.toString() || '',
          click_action: 'FLUTTER_NOTIFICATION_CLICK',
        },
        android: {
          priority: level === 'CRITICAL' || level === 'DANGER' ? 'high' : 'normal',
          notification: { sound: 'default', channelId: 'idms-alerts' },
        },
      };

      const response = await admin.messaging().send(fcmMessage);
      results.push({ channel: 'FCM', success: true, messageId: response });
      logger.info('FCM notification sent', { level, messageId: response });
    } catch (err) {
      results.push({ channel: 'FCM', success: false, error: err.message });
      logger.warn('FCM notification failed (may not be configured)', { err: err.message });
    }
  }

  // ── SMS via MSG91 ─────────────────────────────────────────────────────
  if (channels.includes('SMS') && env.MSG91_AUTH_KEY) {
    try {
      const axios = require('axios');

      const response = await axios.post(
        'https://api.msg91.com/api/v5/flow',
        {
          template_id:  env.MSG91_TEMPLATE_ID,
          sender:       env.MSG91_SENDER_ID,
          short_url:    '0',
          mobiles:      '91XXXXXXXXXX', // In production: query DB for subscribed numbers
          VAR1:         level,
          VAR2:         citizenMessage || message,
        },
        {
          headers: {
            authkey:        env.MSG91_AUTH_KEY,
            'Content-Type': 'application/json',
          },
          timeout: 5000,
        }
      );

      results.push({ channel: 'SMS', success: true });
      logger.info('SMS notification sent', { level });
    } catch (err) {
      results.push({ channel: 'SMS', success: false, error: err.message });
      logger.warn('SMS notification failed (may not be configured)', { err: err.message });
    }
  }

  return results;
};
