// Notification service — FCM push + SMS via MSG91
// Will be implemented in Stage B9
const logger = require('../utils/logger');

const sendFCM = async (tokens, title, body, data = {}) => {
  logger.info('FCM notification stub', { title, tokenCount: tokens.length });
  // Will use firebase-admin messaging
};

const sendSMS = async (phone, message) => {
  logger.info('SMS notification stub', { phone: phone.slice(-4) });
  // Will use MSG91 API
};

const notifyAlert = async (alert) => {
  logger.info('Alert notification stub', { alertId: alert?.id });
  // Will fan out to FCM + SMS based on alert severity
};

module.exports = { sendFCM, sendSMS, notifyAlert };
