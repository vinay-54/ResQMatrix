const { RescueTeam } = require('../models');
const { success, created, error, notFound, badRequest } = require('../utils/apiResponse');
const logger = require('../utils/logger');

exports.getAll = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = { isActive: true };
    if (status) filter.status = status;

    const teams = await RescueTeam.find(filter)
      .populate('assignedOperation', 'name status type')
      .sort({ createdAt: -1 });
    return success(res, teams, 'OK', 200, { total: teams.length });
  } catch (err) {
    logger.error('getAll teams error', { err: err.message });
    return error(res);
  }
};

exports.getOne = async (req, res) => {
  try {
    const team = await RescueTeam
      .findOne({ teamId: req.params.teamId, isActive: true })
      .populate('assignedOperation', 'name status');
    if (!team) return notFound(res, 'Team not found');
    return success(res, team);
  } catch (err) {
    logger.error('getOne team error', { err: err.message });
    return error(res);
  }
};

exports.create = async (req, res) => {
  try {
    const { name, lead } = req.body;
    if (!name || !lead) return badRequest(res, 'name and lead are required');

    const count = await RescueTeam.countDocuments();
    const teamId = req.body.teamId || `T-${String(count + 1).padStart(2, '0')}`;

    const team = await RescueTeam.create({ ...req.body, teamId, lastUpdate: new Date() });

    const io = req.app.get('io');
    io.to('admin-room').emit('team:created', team);
    return created(res, team, `Team ${teamId} created`);
  } catch (err) {
    logger.error('create team error', { err: err.message });
    return error(res);
  }
};

exports.update = async (req, res) => {
  try {
    const allowed = [
      'name', 'lead', 'members', 'contact', 'status', 'zone',
      'vehicle', 'task', 'coords', 'linkedNode', 'assignedOperation',
      'skills', 'equipment',
    ];
    const updates = { lastUpdate: new Date() };
    allowed.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });

    const team = await RescueTeam.findOneAndUpdate(
      { teamId: req.params.teamId }, updates, { new: true }
    );
    if (!team) return notFound(res, 'Team not found');

    const io = req.app.get('io');
    io.to('admin-room').emit('team:updated', team);
    if (updates.coords) {
      io.to('admin-room').emit('team:location', {
        teamId: team.teamId, coords: team.coords, status: team.status,
      });
    }
    return success(res, team, 'Team updated');
  } catch (err) {
    logger.error('update team error', { err: err.message });
    return error(res);
  }
};

exports.remove = async (req, res) => {
  try {
    const team = await RescueTeam.findOneAndUpdate(
      { teamId: req.params.teamId },
      { isActive: false, status: 'off-duty' },
      { new: true }
    );
    if (!team) return notFound(res, 'Team not found');

    const io = req.app.get('io');
    io.to('admin-room').emit('team:deleted', { teamId: req.params.teamId });
    return success(res, null, 'Team removed');
  } catch (err) {
    logger.error('remove team error', { err: err.message });
    return error(res);
  }
};
