const { SensorNode, SensorReading, SOSIncident, Alert } = require('../models');
const firebaseService  = require('./firebaseService');
const alertEngine      = require('./alertEngine');
const logger           = require('../utils/logger');

// ── Topic pattern matchers ────────────────────────────────────────────────
const matchTopic = (pattern, topic) => {
  const regex = new RegExp(
    '^' + pattern.replace(/\+/g, '[^/]+').replace(/#/g, '.*') + '$'
  );
  return regex.test(topic);
};

const extractSegment = (topic, position) =>
  topic.split('/')[position];

// ── MAIN MQTT MESSAGE HANDLER ─────────────────────────────────────────────
// Called by config/mqtt.js on every message received from HiveMQ
exports.handleMQTTMessage = async (topic, payload, io) => {
  logger.debug('MQTT message received', { topic });

  try {
    // ── DSN Sensor Reading ────────────────────────────────────────────
    if (matchTopic('idms/sensors/+/data', topic)) {
      const nodeId = extractSegment(topic, 2);
      await handleSensorData(nodeId, payload, io);
      return;
    }

    // ── DSN Sensor Heartbeat / Status ─────────────────────────────────
    if (matchTopic('idms/sensors/+/status', topic)) {
      const nodeId = extractSegment(topic, 2);
      await handleSensorStatus(nodeId, payload, io);
      return;
    }

    // ── SOS Device Button Press ───────────────────────────────────────
    if (matchTopic('idms/sos/+/alert', topic)) {
      const deviceId = extractSegment(topic, 2);
      await handleSOSAlert(deviceId, payload, io);
      return;
    }

    // ── FWPU-X Purification Data ──────────────────────────────────────
    if (matchTopic('idms/fwpu/+/data', topic)) {
      const unitId = extractSegment(topic, 2);
      await handleFWPUData(unitId, payload, io);
      return;
    }

    // ── DR-1 Drone Telemetry ──────────────────────────────────────────
    if (matchTopic('idms/drones/+/telemetry', topic)) {
      const droneId = extractSegment(topic, 2);
      await handleDroneTelemetry(droneId, payload, io);
      return;
    }

    // ── DR-1 Drone Status/Heartbeat ───────────────────────────────────
    if (matchTopic('idms/drones/+/status', topic)) {
      const droneId = extractSegment(topic, 2);
      await handleDroneStatus(droneId, payload, io);
      return;
    }

    logger.warn('MQTT: unhandled topic', { topic });
  } catch (err) {
    logger.error('MQTT handler error', { topic, err: err.message });
  }
};

// ── HANDLER 1: DSN Sensor Reading ────────────────────────────────────────
const handleSensorData = async (nodeId, payload, io) => {
  try {
    // Normalise field names from ESP32 snake_case to our camelCase
    const reading = {
      nodeId,
      // ESP32 sends water_level in metres — convert to cm
      // OR it may send directly in cm depending on firmware — handle both
      waterLevel: payload.water_level !== undefined
        ? (payload.water_level < 5 ? payload.water_level * 100 : payload.water_level)
        : payload.waterLevel,
      temperature:    payload.temperature,
      humidity:       payload.humidity,
      pressure:       payload.pressure,
      rainfall:       (payload.rainfall_mm ?? payload.rainfall) > 0,
      batteryVoltage: payload.battery_voltage ?? payload.batteryVoltage,
      batteryPercent: estimateBatteryPercent(
        payload.battery_voltage ?? payload.batteryVoltage
      ),
      solarVoltage:   payload.solar_voltage ?? payload.solarVoltage,
      rssi:           payload.rssi,
      commLayer:      (payload.comm_layer ?? payload.commLayer ?? '4G').toUpperCase(),
      lat:            payload.lat,
      lng:            payload.lng,
      deviceTimestamp: payload.timestamp ? new Date(payload.timestamp) : new Date(),
      receivedAt:     new Date(),
    };

    // Validate — must have waterLevel
    if (reading.waterLevel === undefined || reading.waterLevel === null) {
      logger.warn('MQTT: sensor reading missing waterLevel', { nodeId, payload });
      return;
    }

    // 1. Save to MongoDB time-series
    await SensorReading.create(reading);

    // 2. Run alert engine — updates node, generates alert if level changed
    const result = await alertEngine.processSensorReading(nodeId, reading, io);

    // 3. Check battery
    await alertEngine.checkBatteryAlert(nodeId, reading.batteryPercent, io);

    // 4. Update Firebase live state
    await firebaseService.updateNodeLive(nodeId, {
      ...reading,
      name:       result?.node?.name,
      alertLevel: result?.newLevel || 'SAFE',
    });

    // 5. Update system online count in Firebase
    const onlineCount = await SensorNode.countDocuments({
      isActive: true, status: 'online',
    });
    await firebaseService.updateSystemStatus({ onlineNodeCount: onlineCount });

    logger.debug('Sensor reading processed', {
      nodeId,
      waterLevel:   reading.waterLevel,
      alertLevel:   result?.newLevel,
      levelChanged: result?.levelChanged,
    });
  } catch (err) {
    logger.error('handleSensorData error', { nodeId, err: err.message });
  }
};

// ── HANDLER 2: DSN Sensor Status/Heartbeat ────────────────────────────────
const handleSensorStatus = async (nodeId, payload, io) => {
  try {
    const isOnline = payload.status === 'OK' || payload.status === 'online';

    await SensorNode.findOneAndUpdate(
      { nodeId, isActive: true },
      {
        status:   isOnline ? 'online' : 'offline',
        lastSeen: new Date(),
      }
    );

    if (!isOnline) {
      await firebaseService.markNodeOffline(nodeId);

      if (io) {
        io.to('admin-room').emit('sensor:offline', { nodeId, timestamp: Date.now() });
      }
    }

    logger.debug('Sensor heartbeat received', { nodeId, status: payload.status });
  } catch (err) {
    logger.error('handleSensorStatus error', { nodeId, err: err.message });
  }
};

// ── HANDLER 3: SOS Device Alert ───────────────────────────────────────────
const handleSOSAlert = async (deviceId, payload, io) => {
  try {
    if (!payload.button_pressed && payload.status !== 'ALERT') {
      logger.debug('SOS packet — no button press, ignoring', { deviceId });
      return;
    }

    const lat = payload.latitude  ?? payload.lat;
    const lng = payload.longitude ?? payload.lng;

    if (!lat || !lng) {
      logger.warn('SOS alert missing GPS coordinates', { deviceId });
      return;
    }

    const incidentRef = `SOS-${Date.now()}`;

    // Create Alert
    const alert = await Alert.create({
      nodeId:         deviceId,
      nodeName:       `SOS Device ${deviceId}`,
      level:          'DANGER',
      message:        `SOS Alert from device ${deviceId} at (${lat.toFixed(5)}, ${lng.toFixed(5)})`,
      citizenMessage: 'Emergency SOS button pressed — rescue teams notified',
      isSOS:          true,
      sosLocation:    { lat, lng, accuracy: payload.accuracy },
      lat, lng,
      channels:       ['FCM', 'SMS'],
      timestamp:      new Date(),
    });

    // Create SOS Incident
    const incident = await SOSIncident.create({
      alertId:      alert._id,
      incidentRef,
      sourceType:   'PHYSICAL_DEVICE',
      deviceId,
      reporterName: `SOS Device ${deviceId}`,
      location:     { lat, lng, accuracy: payload.accuracy },
      status:       'CREATED',
      statusHistory: [{
        status:    'CREATED',
        note:      `Physical SOS button pressed on device ${deviceId}`,
        changedAt: new Date(),
      }],
      priority: 'critical',
      deviceData: {
        battery:        payload.battery,
        network:        payload.network,
        signalStrength: payload.signal_strength,
        fallDetected:   payload.fall_detected || false,
      },
    });

    // Write to Firebase — visible to all clients instantly
    await firebaseService.writeSOS(incidentRef, {
      lat, lng,
      status:       'CREATED',
      reporterName: `SOS Device ${deviceId}`,
    });

    // Update Firebase alert count
    const unackCount = await Alert.countDocuments({ acknowledged: false });
    await firebaseService.updateAlertCount(unackCount);

    // Emit to all admin clients — real-time map pin appears
    if (io) {
      io.to('admin-room').emit('sos:new', { incident, alert, incidentRef });
      io.to('user-room').emit('sos:new', { incidentRef, lat, lng });
    }

    logger.info('Physical SOS processed', { deviceId, incidentRef, lat, lng });
  } catch (err) {
    logger.error('handleSOSAlert error', { deviceId, err: err.message });
  }
};

// ── HANDLER 4: FWPU-X Purification Data ──────────────────────────────────
const handleFWPUData = async (unitId, payload, io) => {
  try {
    const wq  = payload.waterQuality  || {};
    const sys = payload.systemStatus   || {};
    const loc = payload.location       || {};

    const data = {
      tdsInput:     wq.tds_in,
      tdsOutput:    wq.tds_out,
      turbidityIn:  wq.turbidity_in,
      turbidityOut: wq.turbidity_out,
      ph:           wq.ph,
      temperature:  wq.temperature,
      flowRateIn:   wq.flow_in,
      flowRateOut:  wq.flow_out,
      batteryPct:   sys.battery_percent,
      solarVoltage: sys.solar_voltage,
      roPumpOn:     sys.ro_pump,
      uvOn:         sys.uv,
      motorLeft:    sys.motor_left,
      motorRight:   sys.motor_right,
      mode:         sys.mode || 'IDLE',
      lat:          loc.lat,
      lng:          loc.lng,
    };

    // Update Firebase live state
    await firebaseService.updatePurificationLive(unitId, data);

    // Emit to admin purification page
    if (io) {
      io.to('admin-room').emit('fwpu:live', { unitId, ...data, updatedAt: Date.now() });
    }

    // Alert on high TDS output (water quality poor)
    if (data.tdsOutput !== undefined && data.tdsOutput > 100) {
      await Alert.create({
        nodeId:   unitId,
        nodeName: `FWPU-X ${unitId}`,
        level:    'WARNING',
        message:  `FWPU-X ${unitId}: output TDS ${data.tdsOutput}ppm — above safe limit`,
        citizenMessage: 'Water purification unit needs attention — output quality reduced',
        channels: ['FCM'],
        timestamp: new Date(),
      });
    }

    logger.debug('FWPU-X data processed', { unitId, tdsOut: data.tdsOutput, mode: data.mode });
  } catch (err) {
    logger.error('handleFWPUData error', { unitId, err: err.message });
  }
};

// ── HANDLER 5: DR-1 Drone Telemetry ──────────────────────────────────────
const handleDroneTelemetry = async (droneId, payload, io) => {
  try {
    const gps = payload.gps_location || {};

    const telemetry = {
      lat:              gps.lat          ?? payload.lat,
      lng:              gps.lng          ?? payload.lng,
      altitude:         gps.altitude     ?? payload.altitude     ?? 0,
      batteryPct:       payload.battery_status ?? payload.batteryPct,
      flightMode:       (payload.flight_mode   ?? payload.flightMode   ?? 'STABILIZE').toUpperCase(),
      connectionStatus: payload.connection_status ?? payload.connectionStatus ?? 'connected',
      groundSpeed:      payload.ground_speed ?? payload.groundSpeed ?? 0,
      heading:          payload.heading ?? 0,
      rssi:             payload.rssi    ?? null,
    };

    // 1. Update MongoDB
    const { Drone } = require('../models');
    const telemetrySet = {};
    Object.entries(telemetry).forEach(([k, v]) => {
      if (v !== undefined && v !== null) {
        telemetrySet[`telemetry.${k}`] = v;
      }
    });
    telemetrySet['telemetry.lastSeen'] = new Date();

    if (telemetry.connectionStatus === 'disconnected') {
      telemetrySet.status = 'offline';
    } else if (telemetry.altitude > 2) {
      telemetrySet.status = 'airborne';
    }

    await Drone.findOneAndUpdate(
      { droneId, isActive: true },
      { $set: telemetrySet }
    );

    // 2. Update Firebase — map updates instantly
    await firebaseService.updateDroneTelemetry(droneId, telemetry);

    // 3. Emit to admin map
    if (io) {
      io.to('admin-room').emit('drone:telemetry', {
        droneId,
        telemetry: { ...telemetry, lastSeen: Date.now() },
      });
    }

    // 4. Battery alert if drone battery is critical
    if (telemetry.batteryPct !== null && telemetry.batteryPct < 20) {
      if (io) {
        io.to('admin-room').emit('drone:lowbattery', {
          droneId,
          batteryPct: telemetry.batteryPct,
          message:    `DR-1 ${droneId}: battery at ${telemetry.batteryPct}% — initiate RTL`,
        });
      }
    }

    logger.debug('Drone telemetry processed', {
      droneId,
      lat:     telemetry.lat,
      lng:     telemetry.lng,
      battery: telemetry.batteryPct,
      mode:    telemetry.flightMode,
    });
  } catch (err) {
    logger.error('handleDroneTelemetry error', { droneId, err: err.message });
  }
};

// ── HANDLER 6: DR-1 Drone Status Heartbeat ────────────────────────────────
const handleDroneStatus = async (droneId, payload, io) => {
  try {
    const isOnline = payload.status === 'online' || payload.connected === true;
    const { Drone } = require('../models');

    await Drone.findOneAndUpdate(
      { droneId, isActive: true },
      {
        status: isOnline ? 'standby' : 'offline',
        'telemetry.lastSeen':         new Date(),
        'telemetry.connectionStatus': isOnline ? 'connected' : 'disconnected',
      }
    );

    if (!isOnline) {
      await firebaseService.updateDroneTelemetry(droneId, {
        connectionStatus: 'disconnected',
      });
    }

    logger.debug('Drone status received', { droneId, online: isOnline });
  } catch (err) {
    logger.error('handleDroneStatus error', { droneId, err: err.message });
  }
};

// ── UTILITY: Estimate battery % from voltage ──────────────────────────────
// 12V LiFePO4 — typical for IDMS sensor nodes
const estimateBatteryPercent = (voltage) => {
  if (!voltage) return null;
  if (voltage >= 12.8) return 100;
  if (voltage >= 12.5) return 80;
  if (voltage >= 12.2) return 60;
  if (voltage >= 11.9) return 40;
  if (voltage >= 11.6) return 20;
  return 5;
};
