const { RescueCamp } = require('../models');
const { success, created, error, notFound, badRequest } = require('../utils/apiResponse');
const logger = require('../utils/logger');

exports.getAll = async (req, res) => {
  try {
    const { status, area } = req.query;
    const filter = { isActive: true };
    if (status) filter.status = status;
    if (area)   filter.deploymentArea = area;

    const camps = await RescueCamp.find(filter).sort({ createdAt: -1 });
    return success(res, camps, 'OK', 200, { total: camps.length });
  } catch (err) {
    logger.error('getAll camps error', { err: err.message });
    return error(res);
  }
};

exports.getOne = async (req, res) => {
  try {
    const camp = await RescueCamp.findOne({ campId: req.params.campId, isActive: true });
    if (!camp) return notFound(res, 'Camp not found');
    return success(res, camp);
  } catch (err) {
    logger.error('getOne camp error', { err: err.message });
    return error(res);
  }
};

exports.create = async (req, res) => {
  try {
    const { name, lat, lng } = req.body;
    if (!name || lat === undefined || lng === undefined) {
      return badRequest(res, 'name, lat, and lng are required');
    }

    const count = await RescueCamp.countDocuments();
    const campId = req.body.campId || `RC-${String(count + 1).padStart(2, '0')}`;

    const camp = await RescueCamp.create({ ...req.body, campId });

    const io = req.app.get('io');
    io.to('admin-room').emit('camp:created', camp);
    io.to('user-room').emit('camp:created', {
      campId: camp.campId, name: camp.name,
      lat: camp.lat, lng: camp.lng,
      status: camp.status, capacity: camp.capacity, contact: camp.contact,
    });
    return created(res, camp, `Camp ${campId} created`);
  } catch (err) {
    logger.error('create camp error', { err: err.message });
    return error(res);
  }
};

exports.update = async (req, res) => {
  try {
    const allowed = [
      'name', 'address', 'contact', 'lat', 'lng',
      'status', 'capacity', 'currentOccupancy', 'facilities',
    ];
    const updates = {};
    allowed.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });

    const camp = await RescueCamp.findOneAndUpdate(
      { campId: req.params.campId }, updates, { new: true }
    );
    if (!camp) return notFound(res, 'Camp not found');

    const io = req.app.get('io');
    io.to('admin-room').emit('camp:updated', camp);
    io.to('user-room').emit('camp:updated', {
      campId: camp.campId, name: camp.name,
      lat: camp.lat, lng: camp.lng,
      status: camp.status, capacity: camp.capacity,
    });
    return success(res, camp, 'Camp updated');
  } catch (err) {
    logger.error('update camp error', { err: err.message });
    return error(res);
  }
};

exports.remove = async (req, res) => {
  try {
    const camp = await RescueCamp.findOneAndUpdate(
      { campId: req.params.campId },
      { isActive: false, status: 'closed' },
      { new: true }
    );
    if (!camp) return notFound(res, 'Camp not found');

    const io = req.app.get('io');
    io.to('admin-room').emit('camp:deleted', { campId: req.params.campId });
    io.to('user-room').emit('camp:deleted', { campId: req.params.campId });
    return success(res, null, 'Camp removed');
  } catch (err) {
    logger.error('remove camp error', { err: err.message });
    return error(res);
  }
};
