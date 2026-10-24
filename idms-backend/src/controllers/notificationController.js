const admin = require('firebase-admin');
const { User } = require('../models');
const { success, error, badRequest } = require('../utils/apiResponse');
const { sendToToken, broadcastToTopic } = require('../services/notificationService');
const logger = require('../utils/logger');

// ── POST /api/notifications/subscribe ────────────────────────────────────
exports.subscribe = async (req, res) => {
  try {
    const { fcmToken, topics = ['idms-alerts'] } = req.body;
    if (!fcmToken) return badRequest(res, 'fcmToken is required');

    // Save token to user record
    await User.updateOne({ uid: req.user.uid }, { fcmToken });

    // Subscribe token to requested topics
    const results = await Promise.allSettled(
      topics.map(topic =>
        admin.messaging().subscribeToTopic([fcmToken], topic)
      )
    );

    const succeeded = results.filter(r => r.status === 'fulfilled').length;
    logger.info('FCM subscription', { uid: req.user.uid, topics, succeeded });

    return success(res, { subscribed: topics.slice(0, succeeded) }, 'Subscribed to alerts');
  } catch (err) {
    logger.error('subscribe error', { err: err.message });
    return error(res);
  }
};

// ── POST /api/notifications/unsubscribe ───────────────────────────────────
exports.unsubscribe = async (req, res) => {
  try {
    const { fcmToken, topics = ['idms-alerts'] } = req.body;
    if (!fcmToken) return badRequest(res, 'fcmToken is required');

    await Promise.allSettled(
      topics.map(topic =>
        admin.messaging().unsubscribeFromTopic([fcmToken], topic)
      )
    );

    await User.updateOne({ uid: req.user.uid }, { $unset: { fcmToken: 1 } });
    return success(res, null, 'Unsubscribed from alerts');
  } catch (err) {
    logger.error('unsubscribe error', { err: err.message });
    return error(res);
  }
};

// ── PATCH /api/notifications/fcm-token ────────────────────────────────────
exports.updateToken = async (req, res) => {
  try {
    const { fcmToken } = req.body;
    if (!fcmToken) return badRequest(res, 'fcmToken is required');

    const user = await User.findOne({ uid: req.user.uid });
    if (!user) return error(res, 'User not found', 404);

    // Unsubscribe old token if exists
    if (user.fcmToken && user.fcmToken !== fcmToken) {
      await admin.messaging()
        .unsubscribeFromTopic([user.fcmToken], 'idms-alerts')
        .catch(() => {});
    }

    // Save new token
    await User.updateOne({ uid: req.user.uid }, { fcmToken });

    // Subscribe new token to topics
    const topics = ['idms-alerts'];
    if (['admin', 'coordinator', 'operator'].includes(req.user.role)) {
      topics.push('idms-admin-sos');
    }
    await Promise.allSettled(
      topics.map(t => admin.messaging().subscribeToTopic([fcmToken], t))
    );

    return success(res, null, 'FCM token updated');
  } catch (err) {
    logger.error('updateToken error', { err: err.message });
    return error(res);
  }
};

// ── POST /api/notifications/test ──────────────────────────────────────────
exports.sendTest = async (req, res) => {
  try {
    const { level = 'WARNING', target = 'self' } = req.body;

    if (target === 'self') {
      const user = await User.findOne({ uid: req.user.uid });
      if (!user?.fcmToken) {
        return badRequest(res, 'No FCM token registered for your account');
      }
      const result = await sendToToken({
        token: user.fcmToken,
        level,
        title: `ResQMatrix Test — ${level} Alert`,
        body:  'This is a test notification from ResQMatrix admin panel',
        data:  { test: 'true' },
      });
      return success(res, result, 'Test notification sent');
    }

    if (target === 'all') {
      const result = await broadcastToTopic({
        topic: 'idms-alerts',
        level,
        body:  'ResQMatrix test alert — no action required',
        data:  { test: 'true' },
      });
      return success(res, result, 'Test broadcast sent');
    }

    return badRequest(res, 'target must be "self" or "all"');
  } catch (err) {
    logger.error('sendTest error', { err: err.message });
    return error(res);
  }
};
