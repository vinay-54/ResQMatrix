// MQTT message handler service
// Processes incoming MQTT messages and routes to appropriate handlers
const logger = require('../utils/logger');

const handleMQTTMessage = async (topic, payload, io) => {
  logger.debug('MQTT message received', { topic });

  // Parse topic pattern: idms/{domain}/{id}/{action}
  const parts = topic.split('/');
  const domain = parts[1]; // sensors, drones, sos, fwpu
  const id     = parts[2]; // node/drone/device ID
  const action = parts[3]; // data, telemetry, alert, status

  switch (domain) {
    case 'sensors':
      if (action === 'data') {
        // Will process sensor data and emit to frontend via Socket.io
        logger.info(`Sensor data from ${id}`, { payload });
        if (io) io.to('admin-room').emit('sensor:data', { nodeId: id, ...payload });
      }
      break;

    case 'drones':
      if (action === 'telemetry') {
        logger.info(`Drone telemetry from ${id}`, { payload });
        if (io) io.to('admin-room').emit('drone:telemetry', { droneId: id, ...payload });
      }
      break;

    case 'sos':
      if (action === 'alert') {
        logger.warn(`SOS alert from ${id}`, { payload });
        if (io) {
          io.to('admin-room').emit('sos:alert', { deviceId: id, ...payload });
          io.to('user-room').emit('sos:alert', { deviceId: id, ...payload });
        }
      }
      break;

    case 'fwpu':
      if (action === 'data') {
        logger.info(`FWPU data from ${id}`, { payload });
        if (io) io.to('admin-room').emit('fwpu:data', { unitId: id, ...payload });
      }
      break;

    default:
      logger.warn(`Unhandled MQTT topic: ${topic}`);
  }
};

module.exports = { handleMQTTMessage };
