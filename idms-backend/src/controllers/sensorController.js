const { SensorNode, SensorReading, Alert } = require('../models');
const { success, created, error, notFound, badRequest } = require('../utils/apiResponse');
const logger = require('../utils/logger');

// ── GET /api/sensors ─────────────────────────────────────────────────────
// Returns all active sensor nodes — used by Dashboard, Map, Sensors page
exports.getAll = async (req, res) => {
  try {
    const { area, level, status } = req.query;
    const filter = { isActive: true };
    if (area)   filter.deploymentArea = area;
    if (level)  filter.alertLevel = level;
    if (status) filter.status = status;

    const nodes = await SensorNode.find(filter).sort({ createdAt: -1 });
    return success(res, nodes, 'OK', 200, { total: nodes.length });
  } catch (err) {
    logger.error('getAll sensors error', { err: err.message });
    return error(res);
  }
};

// ── GET /api/sensors/:nodeId ────────────────────────────────────────────
exports.getOne = async (req, res) => {
  try {
    const node = await SensorNode.findOne({
      nodeId: req.params.nodeId,
      isActive: true,
    });
    if (!node) return notFound(res, `Sensor node ${req.params.nodeId} not found`);
    return success(res, node);
  } catch (err) {
    logger.error('getOne sensor error', { err: err.message });
    return error(res);
  }
};

// ── GET /api/sensors/:nodeId/readings ───────────────────────────────────
// Time-series readings for chart on Node Detail page
exports.getReadings = async (req, res) => {
  try {
    const { hours = 24, limit = 288 } = req.query;
    const since = new Date(Date.now() - parseInt(hours) * 3600000);

    const readings = await SensorReading
      .find({ nodeId: req.params.nodeId, receivedAt: { $gte: since } })
      .sort({ receivedAt: -1 })
      .limit(parseInt(limit))
      .select('waterLevel temperature humidity rainfall batteryPercent alertLevel receivedAt commLayer');

    return success(res, readings, 'OK', 200, { total: readings.length, hours });
  } catch (err) {
    logger.error('getReadings error', { err: err.message });
    return error(res);
  }
};

// ── POST /api/sensors ───────────────────────────────────────────────────
exports.create = async (req, res) => {
  try {
    const { nodeId, name, lat, lng, location, deploymentArea } = req.body;
    if (!nodeId || !name || lat === undefined || lng === undefined) {
      return badRequest(res, 'nodeId, name, lat, and lng are required');
    }

    const exists = await SensorNode.findOne({ nodeId });
    if (exists) return badRequest(res, `Node ${nodeId} already exists`);

    const node = await SensorNode.create({
      nodeId, name, lat, lng, location,
      deploymentArea: deploymentArea || 'SVCE Campus',
      ...req.body,
    });

    // Notify all connected admin clients
    const io = req.app.get('io');
    io.to('admin-room').emit('sensor:created', node);

    logger.info('Sensor node created', { nodeId, createdBy: req.user.uid });
    return created(res, node, `Node ${nodeId} created`);
  } catch (err) {
    logger.error('create sensor error', { err: err.message });
    return error(res);
  }
};

// ── PATCH /api/sensors/:nodeId ──────────────────────────────────────────
exports.update = async (req, res) => {
  try {
    const allowed = [
      'name', 'location', 'lat', 'lng', 'deploymentArea',
      'status', 'alertLevel', 'latest', 'thresholds', 'hardware', 'isActive',
    ];
    const updates = {};
    allowed.forEach(f => {
      if (req.body[f] !== undefined) updates[f] = req.body[f];
    });

    const node = await SensorNode.findOneAndUpdate(
      { nodeId: req.params.nodeId },
      updates,
      { new: true, runValidators: true }
    );
    if (!node) return notFound(res, 'Sensor node not found');

    const io = req.app.get('io');
    io.to('admin-room').emit('sensor:updated', node);

    return success(res, node, 'Node updated');
  } catch (err) {
    logger.error('update sensor error', { err: err.message });
    return error(res);
  }
};

// ── DELETE /api/sensors/:nodeId ─────────────────────────────────────────
// Soft delete — sets isActive: false
exports.remove = async (req, res) => {
  try {
    const node = await SensorNode.findOneAndUpdate(
      { nodeId: req.params.nodeId },
      { isActive: false },
      { new: true }
    );
    if (!node) return notFound(res, 'Sensor node not found');

    const io = req.app.get('io');
    io.to('admin-room').emit('sensor:deleted', { nodeId: req.params.nodeId });

    logger.info('Sensor node deleted', { nodeId: req.params.nodeId, by: req.user.uid });
    return success(res, null, `Node ${req.params.nodeId} removed`);
  } catch (err) {
    logger.error('remove sensor error', { err: err.message });
    return error(res);
  }
};

// ── GET /api/sensors/stats/summary ─────────────────────────────────────
// Dashboard KPI numbers
exports.getSummary = async (req, res) => {
  try {
    const [total, online, alertCounts] = await Promise.all([
      SensorNode.countDocuments({ isActive: true }),
      SensorNode.countDocuments({ isActive: true, status: 'online' }),
      SensorNode.aggregate([
        { $match: { isActive: true } },
        { $group: { _id: '$alertLevel', count: { $sum: 1 } } },
      ]),
    ]);

    const levels = {};
    alertCounts.forEach(a => { levels[a._id] = a.count; });

    return success(res, {
      total,
      online,
      offline: total - online,
      levels,
    });
  } catch (err) {
    logger.error('getSummary error', { err: err.message });
    return error(res);
  }
};
