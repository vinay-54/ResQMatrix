/**
 * Run with: npm run test:mqtt
 * Publishes fake sensor/SOS/drone packets to HiveMQ to test the full pipeline
 */
require('dotenv').config();
const mqtt   = require('mqtt');
const logger = require('../utils/logger');
const env    = require('../config/env');

const client = mqtt.connect(env.MQTT_BROKER_URL, {
  username: env.MQTT_USERNAME,
  password: env.MQTT_PASSWORD,
  clientId: `idms-test-${Date.now()}`,
});

client.on('connect', () => {
  logger.info('Test MQTT client connected');

  // ── Test 1: Sensor reading at WARNING level ─────────────────────────
  const sensorPayload = {
    device_id:       'DSN-001',
    timestamp:        new Date().toISOString(),
    water_level:      0.22,     // 22cm — WARNING level
    temperature:      28.4,
    humidity:         78.2,
    pressure:         1012,
    rainfall_mm:      5.2,
    battery_voltage:  12.1,
    solar_voltage:    18.2,
    status:           'OK',
    comm_layer:       '4G',
    rssi:             -70,
    lat:              13.6289,
    lng:              79.4192,
  };

  client.publish(
    'idms/sensors/DSN-001/data',
    JSON.stringify(sensorPayload),
    { qos: 1 },
    (err) => {
      if (err) logger.error('Publish failed', { err: err.message });
      else     logger.info('✅ Sensor payload published', { topic: 'idms/sensors/DSN-001/data' });
    }
  );

  // ── Test 2: SOS device button press ────────────────────────────────
  setTimeout(() => {
    const sosPayload = {
      device_id:      'SOS_001',
      timestamp:       new Date().toISOString(),
      latitude:        13.6289,
      longitude:       79.4192,
      accuracy:        3.2,
      battery:         78,
      button_pressed:  true,
      fall_detected:   false,
      network:         '4G',
      signal_strength: -70,
      status:          'ALERT',
    };

    client.publish(
      'idms/sos/SOS_001/alert',
      JSON.stringify(sosPayload),
      { qos: 1 },
      (err) => {
        if (err) logger.error('SOS publish failed', { err: err.message });
        else     logger.info('✅ SOS payload published', { topic: 'idms/sos/SOS_001/alert' });
      }
    );
  }, 2000);

  // ── Test 3: Drone telemetry ─────────────────────────────────────────
  setTimeout(() => {
    const dronePayload = {
      drone_id:          'DR-001',
      gps_location:      { lat: 13.6291, lng: 79.4198, altitude: 45 },
      battery_status:    72,
      connection_status: 'connected',
      flight_mode:       'AUTO',
      mission_status:    'IN_PROGRESS',
      ground_speed:      8.2,
      heading:           275,
      rssi:              -65,
    };

    client.publish(
      'idms/drones/DR-001/telemetry',
      JSON.stringify(dronePayload),
      { qos: 1 },
      (err) => {
        if (err) logger.error('Drone publish failed', { err: err.message });
        else     logger.info('✅ Drone payload published', { topic: 'idms/drones/DR-001/telemetry' });

        // Close after all tests
        setTimeout(() => {
          client.end();
          logger.info('Test MQTT client disconnected — all payloads sent');
          process.exit(0);
        }, 1000);
      }
    );
  }, 4000);
});

client.on('error', (err) => {
  logger.error('Test MQTT connection failed', { err: err.message });
  process.exit(1);
});
