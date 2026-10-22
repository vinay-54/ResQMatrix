const { SOSIncident, Alert } = require('../models');
const { success, created, error, notFound, badRequest } = require('../utils/apiResponse');
const logger = require('../utils/logger');

// ── POST /api/sos ───────────────────────────────────────────────────────
exports.create = async (req, res) => {
  try {
    const { lat, lng, accuracy, sourceType = 'WEB_PORTAL', deviceId } = req.body;
    if (lat === undefined || lng === undefined) {
      return badRequest(res, 'GPS coordinates (lat, lng) are required');
    }

    const incidentRef = `SOS-${Date.now()}`;

    const alert = await Alert.create({
      nodeId:   sourceType === 'PHYSICAL_DEVICE' ? deviceId : 'sos-web',
      nodeName: req.user?.name || 'Citizen',
      level:    'DANGER',
      message:  `SOS Alert — ${req.user?.name || 'Citizen'} at (${lat.toFixed(5)}, ${lng.toFixed(5)})`,
      citizenMessage: `Emergency SOS from ${req.user?.name || 'a citizen'}`,
      isSOS: true,
      sosLocation: { lat, lng, accuracy },
      lat, lng,
      channels: ['FCM', 'SMS'],
      timestamp: new Date(),
    });

    const incident = await SOSIncident.create({
      alertId:      alert._id,
      incidentRef,
      sourceType,
      deviceId:     deviceId || null,
      reportedBy:   req.user?.userId || null,
      reporterName: req.user?.name || 'Unknown',
      location:     { lat, lng, accuracy },
      status:       'CREATED',
      statusHistory: [{
        status:    'CREATED',
        changedAt: new Date(),
        note:      `SOS received via ${sourceType}`,
      }],
      priority:   'high',
      deviceData: req.body.deviceData || {},
    });

    const io = req.app.get('io');
    io.to('admin-room').emit('sos:new', { incident, alert, incidentRef });

    setTimeout(async () => {
      await SOSIncident.findByIdAndUpdate(incident._id, {
        status: 'RECEIVED',
        $push: { statusHistory: { status: 'RECEIVED', note: 'Received by IDMS system', changedAt: new Date() } },
      });
      io.to('user-room').emit('sos:status', { incidentRef, status: 'RECEIVED' });
    }, 3000);

    logger.info('SOS incident created', { incidentRef, lat, lng, by: req.user?.uid });
    return created(res, { incident, alert, incidentRef }, 'SOS received — rescue teams notified');
  } catch (err) {
    logger.error('create SOS error', { err: err.message });
    return error(res);
  }
};

// ── GET /api/sos ────────────────────────────────────────────────────────
exports.getAll = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (req.user.role === 'citizen') filter.reportedBy = req.user.userId;

    const skip  = (parseInt(page) - 1) * parseInt(limit);
    const total = await SOSIncident.countDocuments(filter);
    const incidents = await SOSIncident
      .find(filter)
      .populate('assignedTeam', 'name lead contact status')
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    return success(res, incidents, 'OK', 200, { total });
  } catch (err) {
    logger.error('getAll SOS error', { err: err.message });
    return error(res);
  }
};

// ── GET /api/sos/:incidentRef ───────────────────────────────────────────
exports.getOne = async (req, res) => {
  try {
    const incident = await SOSIncident
      .findOne({ incidentRef: req.params.incidentRef })
      .populate('assignedTeam', 'name lead contact status coords');
    if (!incident) return notFound(res, 'SOS incident not found');
    if (req.user.role === 'citizen' && incident.reportedBy?.toString() !== req.user.userId) {
      return notFound(res, 'SOS incident not found');
    }
    return success(res, incident);
  } catch (err) {
    logger.error('getOne SOS error', { err: err.message });
    return error(res);
  }
};

// ── PATCH /api/sos/:incidentRef/status ──────────────────────────────────
exports.updateStatus = async (req, res) => {
  try {
    const { status, note, assignedTeam } = req.body;
    const validStatuses = ['RECEIVED', 'ACKNOWLEDGED', 'DISPATCHED', 'IN_PROGRESS', 'RESOLVED', 'CANCELLED'];
    if (!validStatuses.includes(status)) {
      return badRequest(res, `Status must be one of: ${validStatuses.join(', ')}`);
    }

    const updates = {
      status,
      $push: { statusHistory: { status, changedBy: req.user.userId, note: note || '', changedAt: new Date() } },
    };
    if (assignedTeam) { updates.assignedTeam = assignedTeam; updates.assignedAt = new Date(); }
    if (status === 'RESOLVED')   updates.resolvedAt  = new Date();
    if (status === 'DISPATCHED') updates.respondedAt = new Date();

    const incident = await SOSIncident.findOneAndUpdate(
      { incidentRef: req.params.incidentRef }, updates, { new: true }
    ).populate('assignedTeam', 'name lead contact');
    if (!incident) return notFound(res, 'SOS incident not found');

    const io = req.app.get('io');
    io.to('admin-room').emit('sos:updated', incident);
    io.to('user-room').emit('sos:status', {
      incidentRef: incident.incidentRef,
      status:      incident.status,
      team:        incident.assignedTeam?.name,
    });

    logger.info('SOS status updated', { incidentRef: incident.incidentRef, status, by: req.user.uid });
    return success(res, incident, `SOS status updated to ${status}`);
  } catch (err) {
    logger.error('updateStatus SOS error', { err: err.message });
    return error(res);
  }
};
