const { forbidden } = require('../utils/apiResponse');

// Role hierarchy — higher index = higher privilege
const ROLE_HIERARCHY = {
  citizen:     0,
  field:       1,
  operator:    2,
  coordinator: 3,
  admin:       4,
};

/**
 * requireRole(...roles)
 * Route must be accessed by one of the listed roles.
 * Example: requireRole('admin', 'coordinator')
 * Use after verifyJWT.
 */
const requireRole = (...allowedRoles) => (req, res, next) => {
  if (!req.user) {
    return forbidden(res, 'Authentication required');
  }
  if (!allowedRoles.includes(req.user.role)) {
    return forbidden(res, `Access denied — requires one of: ${allowedRoles.join(', ')}`);
  }
  next();
};

/**
 * requireMinRole(minRole)
 * Route requires at least this role level (uses hierarchy).
 * Example: requireMinRole('operator') → allows operator, coordinator, admin
 */
const requireMinRole = (minRole) => (req, res, next) => {
  if (!req.user) {
    return forbidden(res, 'Authentication required');
  }
  const userLevel = ROLE_HIERARCHY[req.user.role] ?? -1;
  const minLevel  = ROLE_HIERARCHY[minRole]       ?? 999;

  if (userLevel < minLevel) {
    return forbidden(res, `Access denied — requires ${minRole} or higher`);
  }
  next();
};

/**
 * requireSelf(paramName)
 * Route only accessible by the user themselves OR an admin.
 * Example: requireSelf('userId') on GET /api/users/:userId
 */
const requireSelf = (paramName = 'userId') => (req, res, next) => {
  if (!req.user) {
    return forbidden(res, 'Authentication required');
  }
  const isSelf  = req.params[paramName] === req.user.userId;
  const isAdmin = ROLE_HIERARCHY[req.user.role] >= ROLE_HIERARCHY['admin'];

  if (!isSelf && !isAdmin) {
    return forbidden(res, 'Access denied — you can only access your own data');
  }
  next();
};

// Convenience exports for common role combinations
const adminOnly       = requireRole('admin');
const adminOrCoord    = requireRole('admin', 'coordinator');
const adminOrOperator = requireRole('admin', 'coordinator', 'operator');
const staffOnly       = requireMinRole('field');
const citizenOrAbove  = requireMinRole('citizen'); // everyone

module.exports = {
  requireRole,
  requireMinRole,
  requireSelf,
  adminOnly,
  adminOrCoord,
  adminOrOperator,
  staffOnly,
  citizenOrAbove,
  ROLE_HIERARCHY,
};
