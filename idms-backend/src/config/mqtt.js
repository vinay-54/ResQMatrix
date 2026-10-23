const mqtt   = require('mqtt');
const env    = require('./env');
const logger = require('../utils/logger');

let client = null;

// Topics the backend subscribes to
const TOPICS = {
  SENSOR_DATA:     'idms/sensors/+/data',       // + = node ID wildcard
  SENSOR_STATUS:   'idms/sensors/+/status',
  SOS_ALERT:       'idms/sos/+/alert',
  FWPU_DATA:       'idms/fwpu/+/data',
  DRONE_TELEMETRY: 'idms/drones/+/telemetry',
  DRONE_STATUS:    'idms/drones/+/status',
};

const connectMQTT = (app) => new Promise((resolve, reject) => {
  client = mqtt.connect(env.MQTT_BROKER_URL, {
    username:           env.MQTT_USERNAME,
    password:           env.MQTT_PASSWORD,
    clientId:           `idms-backend-${Date.now()}`,
    clean:              true,
    reconnectPeriod:    5000,
    connectTimeout:     10000,
    rejectUnauthorized: env.NODE_ENV === 'production',
  });

  client.on('connect', () => {
    logger.info('MQTT connected to HiveMQ');
    Object.values(TOPICS).forEach(topic => {
      client.subscribe(topic, { qos: 1 }, (err) => {
        if (err) logger.error(`Failed to subscribe to ${topic}`, { err: err.message });
        else     logger.info(`Subscribed to ${topic}`);
      });
    });
    resolve(client);
  });

  client.on('message', async (topic, message) => {
    try {
      const payload = JSON.parse(message.toString());
      const io      = app.get('io');

      // Import the MQTT message handler (avoids circular deps)
      const { handleMQTTMessage } = require('../services/mqttService');
      await handleMQTTMessage(topic, payload, io);
    } catch (err) {
      logger.error('MQTT message processing error', { topic, err: err.message });
    }
  });

  client.on('error',      err => { logger.error('MQTT error', { err: err.message }); reject(err); });
  client.on('reconnect',  ()  => logger.warn('MQTT reconnecting...'));
  client.on('offline',    ()  => logger.warn('MQTT offline'));
  client.on('disconnect', ()  => logger.warn('MQTT disconnected'));
});

const publishMQTT = (topic, payload, options = { qos: 1 }) => {
  if (!client?.connected) {
    logger.warn('MQTT not connected — cannot publish');
    return false;
  }
  client.publish(topic, JSON.stringify(payload), options);
  return true;
};

const getMQTTClient = () => client;

module.exports = { connectMQTT, publishMQTT, getMQTTClient, TOPICS };
