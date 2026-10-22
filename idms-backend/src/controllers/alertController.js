const { Alert } = require('../models');
const { success, created, error, notFound, badRequest } = require('../utils/apiResponse');
const logger = require('../utils/logger');

// ── GET /api/alerts ─────────────────────────────────────────────────────
exports.getAll = async (req, res) => {
  try {
    const {
      level, acknowledged, isSOS,
      page = 1, limit = 50, since,
    } = req.query;

    const filter = {};
    if (level !== undefined)        filter.level = level;
    if (acknowledged !== undefined)  filter.acknowledged = acknowledged === 'true';
    if (isSOS !== undefined)         filter.isSOS = isSOS === 'true';
    if (since)                       filter.timestamp = { $gte: new Date(since) };

    // Citizens only see non-system, non-SOS alerts (safety alerts)
    if (req.user.role === 'citizen') {
      filter.level = { $in: ['WATCH', 'WARNING', 'DANGER', 'CRITICAL'] };
      filter.isSOS = false;
    }

    const skip  = (parseInt(page) - 1) * parseInt(limit);
    const total = await Alert.countDocuments(filter);
    const alerts = await Alert
      .find(filter)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    return success(res, alerts, 'OK', 200, {
      total,
      page:  parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / parseInt(limit)),
      unacknowledged: await Alert.countDocuments({ ...filter, acknowledged: false }),
    });
  } catch (err) {
    logger.error('getAll alerts error', { err: err.message });
    return error(res);
  }
};

// ── GET /api/alerts/:id ─────────────────────────────────────────────────
exports.getOne = async (req, res) => {
  try {
    const alert = await Alert.findById(req.params.id);
    if (!alert) return notFound(res, 'Alert not found');
    return success(res, alert);
  } catch (err) {
    logger.error('getOne alert error', { err: err.message });
    return error(res);
  }
};

// ── POST /api/alerts ────────────────────────────────────────────────────
// Used by alert engine and manual creation
exports.create = async (req, res) => {
  try {
    const { level, message } = req.body;
    if (!level || !message) {
      return badRequest(res, 'level and message are required');
    }

    const alert = await Alert.create(req.body);

    const io = req.app.get('io');
    // Emit to admins with full data
    io.to('admin-room').emit('alert:new', alert);

    // Emit to citizens with plain language version only
    if (alert.citizenMessage) {
      io.to('user-room').emit('alert:citizen', {
        id:             alert._id,
        level:          alert.level,
        citizenMessage: alert.citizenMessage,
        timestamp:      alert.timestamp,
        nodeId:         alert.nodeId,
        nodeName:       alert.nodeName,
      });
    }

    return created(res, alert, 'Alert created');
  } catch (err) {
    logger.error('create alert error', { err: err.message });
    return error(res);
  }
};

// ── PATCH /api/alerts/:id/acknowledge ───────────────────────────────────
exports.acknowledge = async (req, res) => {
  try {
    const alert = await Alert.findByIdAndUpdate(
      req.params.id,
      {
        acknowledged:   true,
        acknowledgedBy: req.user.userId,
        acknowledgedAt: new Date(),
      },
      { new: true }
    );
    if (!alert) return notFound(res, 'Alert not found');

    const io = req.app.get('io');
    io.to('admin-room').emit('alert:acknowledged', {
      id:             alert._id,
      acknowledgedBy: req.user.email,
      acknowledgedAt: alert.acknowledgedAt,
    });

    return success(res, alert, 'Alert acknowledged');
  } catch (err) {
    logger.error('acknowledge alert error', { err: err.message });
    return error(res);
  }
};

// ── PATCH /api/alerts/acknowledge-all ───────────────────────────────────
exports.acknowledgeAll = async (req, res) => {
  try {
    const result = await Alert.updateMany(
      { acknowledged: false },
      {
        acknowledged:   true,
        acknowledgedBy: req.user.userId,
        acknowledgedAt: new Date(),
      }
    );

    const io = req.app.get('io');
    io.to('admin-room').emit('alert:all-acknowledged', { count: result.modifiedCount });

    return success(res, { modified: result.modifiedCount }, 'All alerts acknowledged');
  } catch (err) {
    logger.error('acknowledgeAll error', { err: err.message });
    return error(res);
  }
};

// ── DELETE /api/alerts/:id ──────────────────────────────────────────────
exports.remove = async (req, res) => {
  try {
    const alert = await Alert.findByIdAndDelete(req.params.id);
    if (!alert) return notFound(res, 'Alert not found');
    return success(res, null, 'Alert deleted');
  } catch (err) {
    logger.error('remove alert error', { err: err.message });
    return error(res);
  }
};
