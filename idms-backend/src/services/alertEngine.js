const { SensorNode, Alert }   = require('../models');
const { updateAlertCount }    = require('./firebaseService');
const { sendNotification }    = require('./notificationService');
const logger                  = require('../utils/logger');

// ── Thresholds — match .env values ───────────────────────────────────────
const getThresholds = (nodeThresholds) => ({
  safe:     nodeThresholds?.safe     ?? parseInt(process.env.THRESHOLD_SAFE)     ?? 80,
  watch:    nodeThresholds?.watch    ?? parseInt(process.env.THRESHOLD_WATCH)    ?? 40,
  warning:  nodeThresholds?.warning  ?? parseInt(process.env.THRESHOLD_WARNING)  ?? 25,
  danger:   nodeThresholds?.danger   ?? parseInt(process.env.THRESHOLD_DANGER)   ?? 15,
  critical: nodeThresholds?.critical ?? parseInt(process.env.THRESHOLD_CRITICAL) ??  8,
});

// ── Determine alert level from water level reading ─────────────────────
const getAlertLevel = (waterLevel, thresholds) => {
  // waterLevel = distance from sensor to water surface
  // LOWER distance = HIGHER water = MORE dangerous
  if (waterLevel <= thresholds.critical) return 'CRITICAL';
  if (waterLevel <= thresholds.danger)   return 'DANGER';
  if (waterLevel <= thresholds.warning)  return 'WARNING';
  if (waterLevel <= thresholds.watch)    return 'WATCH';
  return 'SAFE';
};

// ── Plain language message for citizen portal ──────────────────────────
const getCitizenMessage = (level, nodeName) => {
  const loc = nodeName || 'your area';
  const map = {
    CRITICAL: `Water level is extremely dangerous at ${loc} — evacuate immediately`,
    DANGER:   `Water level is dangerously high at ${loc} — evacuate now`,
    WARNING:  `Water level is rising fast at ${loc} — prepare to evacuate`,
    WATCH:    `Water level is increasing at ${loc} — stay alert`,
    SAFE:     `Water levels have returned to normal at ${loc}`,
  };
  return map[level] || 'Flood monitoring update from your area';
};

// ── Notification channels per alert level ─────────────────────────────
const getChannels = (level) => {
  const map = {
    CRITICAL: ['FCM', 'SMS'],
    DANGER:   ['FCM', 'SMS'],
    WARNING:  ['FCM'],
    WATCH:    ['FCM'],
    SAFE:     [],
  };
  return map[level] || [];
};

// ── MAIN: Process sensor reading through alert engine ─────────────────
exports.processSensorReading = async (nodeId, reading, io) => {
  try {
    // 1. Get node from DB to access custom thresholds and name
    const node = await SensorNode.findOne({ nodeId, isActive: true });
    if (!node) {
      logger.warn('Alert engine: unknown nodeId', { nodeId });
      return null;
    }

    const thresholds   = getThresholds(node.thresholds);
    const newLevel     = getAlertLevel(reading.waterLevel, thresholds);
    const prevLevel    = node.alertLevel;
    const levelChanged = newLevel !== prevLevel;

    // 2. Update node in MongoDB with latest reading
    await SensorNode.findOneAndUpdate(
      { nodeId },
      {
        alertLevel: newLevel,
        status:     'online',
        lastSeen:   new Date(),
        latest: {
          waterLevel:   reading.waterLevel,
          temperature:  reading.temperature,
          humidity:     reading.humidity,
          pressure:     reading.pressure,
          rainfall:     reading.rainfall,
          battery:      reading.batteryPercent,
          solarVoltage: reading.solarVoltage,
          rssi:         reading.rssi,
          commLayer:    reading.commLayer || '4G',
          receivedAt:   new Date(),
        },
      }
    );

    // 3. Generate alert only when level changes — not on every reading
    let alert = null;
    if (levelChanged) {
      const shouldAlert = newLevel !== 'SAFE' || prevLevel !== 'SAFE';

      if (shouldAlert) {
        const channels = getChannels(newLevel);
        alert = await Alert.create({
          nodeId,
          nodeName:       node.name,
          level:          newLevel,
          message:        `${node.name}: water level ${reading.waterLevel}cm — ${newLevel}`,
          detail:         `Previous level: ${prevLevel}. Threshold crossed: ${reading.waterLevel}cm. Location: ${node.location}.`,
          citizenMessage: getCitizenMessage(newLevel, node.name),
          waterLevel:     reading.waterLevel,
          threshold:      thresholds[newLevel.toLowerCase()],
          channels,
          lat:            node.lat,
          lng:            node.lng,
          timestamp:      new Date(),
        });

        // Update Firebase alert count
        const unackCount = await Alert.countDocuments({ acknowledged: false });
        await updateAlertCount(unackCount);

        // Send push/SMS notifications for WARNING and above
        if (channels.length > 0) {
          await sendNotification({
            level:          newLevel,
            message:        alert.message,
            citizenMessage: alert.citizenMessage,
            channels,
            location:       { lat: node.lat, lng: node.lng },
          });
        }

        // Emit to admin and citizen rooms via Socket.io
        if (io) {
          io.to('admin-room').emit('alert:new', alert);
          if (alert.citizenMessage) {
            io.to('user-room').emit('alert:citizen', {
              id:             alert._id,
              level:          alert.level,
              citizenMessage: alert.citizenMessage,
              nodeName:       alert.nodeName,
              timestamp:      alert.timestamp,
            });
          }
        }

        logger.info('Alert generated', {
          nodeId, prevLevel, newLevel,
          waterLevel: reading.waterLevel,
        });
      }
    }

    // 4. Always emit live sensor update via Socket.io
    if (io) {
      io.to('admin-room').emit('sensor:live', {
        nodeId,
        name:       node.name,
        alertLevel: newLevel,
        waterLevel: reading.waterLevel,
        battery:    reading.batteryPercent,
        commLayer:  reading.commLayer,
        updatedAt:  Date.now(),
      });
    }

    return { alert, newLevel, prevLevel, levelChanged, node };
  } catch (err) {
    logger.error('Alert engine error', { nodeId, err: err.message });
    return null;
  }
};

// ── Battery low alert ─────────────────────────────────────────────────
exports.checkBatteryAlert = async (nodeId, batteryPercent, io) => {
  try {
    if (batteryPercent !== null && batteryPercent < 20) {
      const node = await SensorNode.findOne({ nodeId });
      if (!node) return;

      // Only create one battery alert per session (not every reading)
      const recentBatteryAlert = await Alert.findOne({
        nodeId,
        message: { $regex: 'battery', $options: 'i' },
        timestamp: { $gte: new Date(Date.now() - 3600000) }, // last 1 hour
      });

      if (!recentBatteryAlert) {
        const alert = await Alert.create({
          nodeId,
          nodeName: node.name,
          level:    'WATCH',
          message:  `${node.name}: low battery ${batteryPercent}%`,
          detail:   'Node running on battery backup. Solar charging may be insufficient.',
          citizenMessage: 'Communication signal reduced at a monitoring station',
          channels: [],
          timestamp: new Date(),
        });

        if (io) {
          io.to('admin-room').emit('alert:new', alert);
        }
      }
    }
  } catch (err) {
    logger.error('Battery alert check error', { nodeId, err: err.message });
  }
};
