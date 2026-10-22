const { Operation } = require('../models');
const { success, created, error, notFound, badRequest } = require('../utils/apiResponse');
const logger = require('../utils/logger');

exports.getAll = async (req, res) => {
  try {
    const { status, type } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (type)   filter.type = type;

    const ops = await Operation.find(filter)
      .populate('assignedTeams', 'name lead status contact')
      .sort({ createdAt: -1 });
    return success(res, ops, 'OK', 200, { total: ops.length });
  } catch (err) {
    logger.error('getAll operations error', { err: err.message });
    return error(res);
  }
};

exports.getOne = async (req, res) => {
  try {
    const op = await Operation
      .findOne({ operationId: req.params.operationId })
      .populate('assignedTeams', 'name lead status contact coords');
    if (!op) return notFound(res, 'Operation not found');
    return success(res, op);
  } catch (err) {
    logger.error('getOne operation error', { err: err.message });
    return error(res);
  }
};

exports.create = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return badRequest(res, 'name is required');

    const count = await Operation.countDocuments();
    const operationId = req.body.operationId || `OP-${String(count + 1).padStart(3, '0')}`;

    const op = await Operation.create({
      ...req.body,
      operationId,
      createdBy: req.user.userId,
      startTime: new Date(),
    });

    const io = req.app.get('io');
    io.to('admin-room').emit('operation:created', op);
    return created(res, op, `Operation ${operationId} created`);
  } catch (err) {
    logger.error('create operation error', { err: err.message });
    return error(res);
  }
};

exports.update = async (req, res) => {
  try {
    const allowed = [
      'name', 'description', 'type', 'status', 'priority',
      'location', 'lat', 'lng', 'assignedTeams', 'assignedResources', 'endTime',
    ];
    const updates = {};
    allowed.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });

    const op = await Operation.findOneAndUpdate(
      { operationId: req.params.operationId }, updates, { new: true }
    );
    if (!op) return notFound(res, 'Operation not found');

    const io = req.app.get('io');
    io.to('admin-room').emit('operation:updated', op);
    return success(res, op, 'Operation updated');
  } catch (err) {
    logger.error('update operation error', { err: err.message });
    return error(res);
  }
};

exports.remove = async (req, res) => {
  try {
    const op = await Operation.findOneAndUpdate(
      { operationId: req.params.operationId },
      { status: 'cancelled', isActive: false },
      { new: true }
    );
    if (!op) return notFound(res, 'Operation not found');

    const io = req.app.get('io');
    io.to('admin-room').emit('operation:deleted', { operationId: req.params.operationId });
    return success(res, null, 'Operation cancelled and removed');
  } catch (err) {
    logger.error('remove operation error', { err: err.message });
    return error(res);
  }
};
