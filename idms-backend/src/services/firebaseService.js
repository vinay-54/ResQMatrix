const { getDatabase } = require('../config/firebase');
const logger          = require('../utils/logger');

// ── Helper: get DB reference ──────────────────────────────────────────────
const ref = (path) => getDatabase().ref(path);

// ── SENSOR NODE — write live reading ─────────────────────────────────────
/**
 * Called after every MQTT packet from a DSN node.
 * Updates the /nodes/{nodeId} path with the latest reading.
 * All frontend clients with a listener on this path update instantly.
 */
exports.updateNodeLive = async (nodeId, data) => {
  try {
    await ref(`idms/nodes/${nodeId}`).update({
      nodeId,
      name:        data.name        || null,
      alertLevel:  data.alertLevel  || 'SAFE',
      status:      'online',
      waterLevel:  data.waterLevel  ?? null,
      temperature: data.temperature ?? null,
      humidity:    data.humidity    ?? null,
      pressure:    data.pressure    ?? null,
      rainfall:    data.rainfall    ?? false,
      battery:     data.batteryPercent ?? data.battery ?? null,
      commLayer:   data.commLayer   || '4G',
      rssi:        data.rssi        || null,
      lat:         data.lat         || null,
      lng:         data.lng         || null,
      updatedAt:   Date.now(),
    });
  } catch (err) {
    logger.error('Firebase updateNodeLive error', { nodeId, err: err.message });
  }
};

// ── SENSOR NODE — mark offline ────────────────────────────────────────────
exports.markNodeOffline = async (nodeId) => {
  try {
    await ref(`idms/nodes/${nodeId}`).update({
      status:    'offline',
      updatedAt: Date.now(),
    });
  } catch (err) {
    logger.error('Firebase markNodeOffline error', { nodeId, err: err.message });
  }
};

// ── DRONE — write live telemetry ──────────────────────────────────────────
/**
 * Called after every MQTT telemetry packet from DR-1.
 * Matches exact RoboMonk MQTT payload fields.
 */
exports.updateDroneTelemetry = async (droneId, telemetry) => {
  try {
    await ref(`idms/drones/${droneId}`).update({
      droneId,
      status:            telemetry.connectionStatus === 'disconnected' ? 'offline' : 'airborne',
      lat:               telemetry.lat             ?? null,
      lng:               telemetry.lng             ?? null,
      altitude:          telemetry.altitude        ?? 0,
      batteryPct:        telemetry.batteryPct      ?? null,
      flightMode:        telemetry.flightMode      || 'STABILIZE',
      connectionStatus:  telemetry.connectionStatus|| 'disconnected',
      groundSpeed:       telemetry.groundSpeed     ?? 0,
      heading:           telemetry.heading         ?? 0,
      rssi:              telemetry.rssi            ?? null,
      updatedAt:         Date.now(),
    });
  } catch (err) {
    logger.error('Firebase updateDroneTelemetry error', { droneId, err: err.message });
  }
};

// ── SYSTEM STATUS — update global health ─────────────────────────────────
exports.updateSystemStatus = async (data) => {
  try {
    await ref('idms/system').update({
      ...data,
      lastUpdated: Date.now(),
    });
  } catch (err) {
    logger.error('Firebase updateSystemStatus error', { err: err.message });
  }
};

// ── ALERT COUNT — keep system/activeAlertCount in sync ───────────────────
exports.updateAlertCount = async (count) => {
  try {
    await ref('idms/system/activeAlertCount').set(count);
  } catch (err) {
    logger.error('Firebase updateAlertCount error', { err: err.message });
  }
};

// ── SOS — write active incident to Firebase ───────────────────────────────
/**
 * Active SOS incidents are visible to all connected clients instantly.
 * Removed from Firebase when resolved — historical record stays in MongoDB.
 */
exports.writeSOS = async (incidentRef, data) => {
  try {
    await ref(`idms/sos/active/${incidentRef}`).set({
      incidentRef,
      lat:       data.lat,
      lng:       data.lng,
      status:    data.status || 'CREATED',
      reporter:  data.reporterName || 'Citizen',
      timestamp: Date.now(),
    });
  } catch (err) {
    logger.error('Firebase writeSOS error', { incidentRef, err: err.message });
  }
};

// ── SOS — update status ───────────────────────────────────────────────────
exports.updateSOSStatus = async (incidentRef, status) => {
  try {
    await ref(`idms/sos/active/${incidentRef}`).update({
      status,
      updatedAt: Date.now(),
    });

    // Remove from active list when resolved or cancelled
    if (status === 'RESOLVED' || status === 'CANCELLED') {
      await ref(`idms/sos/active/${incidentRef}`).remove();
      logger.info('SOS removed from Firebase active list', { incidentRef });
    }
  } catch (err) {
    logger.error('Firebase updateSOSStatus error', { incidentRef, err: err.message });
  }
};

// ── PURIFICATION — write FWPU-X live data ────────────────────────────────
exports.updatePurificationLive = async (unitId, data) => {
  try {
    await ref(`idms/purification/${unitId}`).update({
      unitId,
      tdsOutput:    data.tdsOutput    ?? null,
      flowRateOut:  data.flowRateOut  ?? null,
      ph:           data.ph           ?? null,
      batteryPct:   data.batteryPct   ?? null,
      mode:         data.mode         || 'IDLE',
      roPumpOn:     data.roPumpOn     ?? false,
      uvOn:         data.uvOn         ?? false,
      lat:          data.lat          ?? null,
      lng:          data.lng          ?? null,
      updatedAt:    Date.now(),
    });
  } catch (err) {
    logger.error('Firebase updatePurificationLive error', { unitId, err: err.message });
  }
};

// ── SEED — initialise Firebase with existing MongoDB data ─────────────────
/**
 * Run once on server startup to seed Firebase with current DB state.
 * Prevents Firebase from being empty until first MQTT packet arrives.
 */
exports.seedFromMongoDB = async () => {
  try {
    const { SensorNode, Drone } = require('../models');

    const [nodes, drones] = await Promise.all([
      SensorNode.find({ isActive: true }),
      Drone.find({ isActive: true }),
    ]);

    const nodeBatch = {};
    nodes.forEach(node => {
      nodeBatch[node.nodeId] = {
        nodeId:      node.nodeId,
        name:        node.name,
        alertLevel:  node.alertLevel,
        status:      node.status,
        waterLevel:  node.latest?.waterLevel  ?? null,
        temperature: node.latest?.temperature ?? null,
        humidity:    node.latest?.humidity    ?? null,
        battery:     node.latest?.battery     ?? null,
        lat:         node.lat,
        lng:         node.lng,
        updatedAt:   Date.now(),
      };
    });

    const droneBatch = {};
    drones.forEach(drone => {
      droneBatch[drone.droneId] = {
        droneId:          drone.droneId,
        status:           drone.status,
        batteryPct:       drone.telemetry?.batteryPct       ?? null,
        flightMode:       drone.telemetry?.flightMode       || 'STABILIZE',
        connectionStatus: drone.telemetry?.connectionStatus || 'disconnected',
        lat:              drone.telemetry?.lat ?? null,
        lng:              drone.telemetry?.lng ?? null,
        updatedAt:        Date.now(),
      };
    });

    if (Object.keys(nodeBatch).length > 0) {
      await ref('idms/nodes').update(nodeBatch);
    }
    if (Object.keys(droneBatch).length > 0) {
      await ref('idms/drones').update(droneBatch);
    }

    await ref('idms/system').update({
      onlineNodeCount:  nodes.filter(n => n.status === 'online').length,
      activeAlertCount: 0,
      mqttConnected:    false,
      lastUpdated:      Date.now(),
    });

    logger.info('Firebase seeded from MongoDB', {
      nodes:  Object.keys(nodeBatch).length,
      drones: Object.keys(droneBatch).length,
    });
  } catch (err) {
    logger.error('Firebase seed error', { err: err.message });
  }
};
