const { Drone, DroneMission } = require('../models');
const { success, created, error, notFound, badRequest } = require('../utils/apiResponse');
const logger = require('../utils/logger');

exports.getAll = async (req, res) => {
  try {
    const drones = await Drone.find({ isActive: true })
      .populate('assignedOperation', 'name status')
      .populate('assignedOperator', 'name email');
    return success(res, drones, 'OK', 200, { total: drones.length });
  } catch (err) {
    logger.error('getAll drones error', { err: err.message });
    return error(res);
  }
};

exports.getOne = async (req, res) => {
  try {
    const drone = await Drone.findOne({ droneId: req.params.droneId, isActive: true })
      .populate('assignedOperation', 'name status type')
      .populate('assignedOperator', 'name email');
    if (!drone) return notFound(res, 'Drone not found');
    return success(res, drone);
  } catch (err) {
    logger.error('getOne drone error', { err: err.message });
    return error(res);
  }
};

exports.create = async (req, res) => {
  try {
    const { droneId } = req.body;
    if (!droneId) return badRequest(res, 'droneId is required');

    const drone = await Drone.create(req.body);

    const io = req.app.get('io');
    io.to('admin-room').emit('drone:created', drone);
    return created(res, drone, `Drone ${droneId} registered`);
  } catch (err) {
    logger.error('create drone error', { err: err.message });
    return error(res);
  }
};

exports.update = async (req, res) => {
  try {
    const allowed = [
      'model', 'status', 'missionStatus',
      'assignedOperation', 'assignedOperator', 'specs', 'dgca',
    ];
    const updates = {};
    allowed.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });

    const drone = await Drone.findOneAndUpdate(
      { droneId: req.params.droneId }, updates, { new: true }
    );
    if (!drone) return notFound(res, 'Drone not found');

    const io = req.app.get('io');
    io.to('admin-room').emit('drone:updated', drone);
    return success(res, drone, 'Drone updated');
  } catch (err) {
    logger.error('update drone error', { err: err.message });
    return error(res);
  }
};

// ── PATCH /api/drones/:droneId/telemetry ────────────────────────────────
// Called by MQTT service when drone telemetry packet arrives
exports.updateTelemetry = async (req, res) => {
  try {
    const {
      lat, lng, altitude, batteryPct, flightMode,
      connectionStatus, rssi, groundSpeed, heading,
    } = req.body;

    const telemetryUpdate = {
      'telemetry.lat':              lat,
      'telemetry.lng':              lng,
      'telemetry.altitude':         altitude,
      'telemetry.batteryPct':       batteryPct,
      'telemetry.flightMode':       flightMode,
      'telemetry.connectionStatus': connectionStatus,
      'telemetry.rssi':             rssi,
      'telemetry.groundSpeed':      groundSpeed,
      'telemetry.heading':          heading,
      'telemetry.lastSeen':         new Date(),
    };

    // Remove undefined values
    Object.keys(telemetryUpdate).forEach(k => {
      if (telemetryUpdate[k] === undefined) delete telemetryUpdate[k];
    });

    // Auto-update status from connection state
    if (connectionStatus === 'disconnected') telemetryUpdate.status = 'offline';

    const drone = await Drone.findOneAndUpdate(
      { droneId: req.params.droneId },
      { $set: telemetryUpdate },
      { new: true }
    );
    if (!drone) return notFound(res, 'Drone not found');

    // Push to admin map in real time
    const io = req.app.get('io');
    io.to('admin-room').emit('drone:telemetry', {
      droneId:   drone.droneId,
      telemetry: drone.telemetry,
      status:    drone.status,
    });

    return success(res, drone.telemetry, 'Telemetry updated');
  } catch (err) {
    logger.error('updateTelemetry error', { err: err.message });
    return error(res);
  }
};

exports.remove = async (req, res) => {
  try {
    const drone = await Drone.findOneAndUpdate(
      { droneId: req.params.droneId },
      { isActive: false },
      { new: true }
    );
    if (!drone) return notFound(res, 'Drone not found');

    const io = req.app.get('io');
    io.to('admin-room').emit('drone:deleted', { droneId: req.params.droneId });
    return success(res, null, 'Drone removed');
  } catch (err) {
    logger.error('remove drone error', { err: err.message });
    return error(res);
  }
};
