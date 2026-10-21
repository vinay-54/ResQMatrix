// Firebase Realtime Database operations service
// Will be implemented when Firebase RTDB integration is done
const logger = require('../utils/logger');

const writeSensorData = async (nodeId, data) => {
  logger.debug('Firebase RTDB write stub', { nodeId });
  // Will write to /sensors/{nodeId}/latest
};

const readLatestSensorData = async (nodeId) => {
  logger.debug('Firebase RTDB read stub', { nodeId });
  return null;
};

module.exports = { writeSensorData, readLatestSensorData };
