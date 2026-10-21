const jwt    = require('jsonwebtoken');
const User   = require('../models/User');
const { getAuth } = require('../config/firebase');
const { success, created, error, unauthorized, badRequest } = require('../utils/apiResponse');
const logger = require('../utils/logger');
const env    = require('../config/env');

// ── Helper: generate JWT ─────────────────────────────────────────────────
const generateJWT = (user) => jwt.sign(
  {
    uid:    user.uid,
    email:  user.email,
    role:   user.role,
    userId: user._id.toString(),
  },
  env.JWT_SECRET,
  { expiresIn: env.JWT_EXPIRES_IN }
);

// ── Helper: format user for response ────────────────────────────────────
const formatUser = (user) => ({
  id:           user._id,
  uid:          user.uid,
  email:        user.email,
  name:         user.name,
  role:         user.role,
  phone:        user.phone,
  homeAddress:  user.homeAddress,
  familyCount:  user.familyCount,
  notifyAlerts: user.notifyAlerts,
  notifySMS:    user.notifySMS,
  language:     user.language,
  isAdminRole:  user.isAdminRole,
  isCitizen:    user.isCitizen,
  lastLogin:    user.lastLogin,
  createdAt:    user.createdAt,
});


/**
 * POST /api/auth/login
 * Called after Firebase client-side sign-in.
 * Receives Firebase ID token, verifies it, returns our JWT + user profile.
 * Creates a MongoDB user record if first login.
 */
exports.login = async (req, res) => {
  try {
    const firebaseUser = req.firebaseUser; // Attached by verifyFirebaseToken middleware
    const { fcmToken } = req.body;         // Optional push notification token

    // Find or create user in MongoDB
    let user = await User.findOne({ uid: firebaseUser.uid });

    if (!user) {
      // First login — create user record with default role citizen
      user = await User.create({
        uid:   firebaseUser.uid,
        email: firebaseUser.email,
        name:  firebaseUser.name || firebaseUser.email.split('@')[0],
        role:  'citizen', // Default — admin upgrades via /api/auth/set-role
      });
      logger.info('New user registered', { uid: user.uid, email: user.email });
    }

    if (!user.isActive) {
      return unauthorized(res, 'Account deactivated — contact administrator');
    }

    // Update last login and FCM token
    const updates = { lastLogin: new Date() };
    if (fcmToken) updates.fcmToken = fcmToken;
    await User.updateOne({ _id: user._id }, updates);
    user.lastLogin = updates.lastLogin;

    // Issue our own JWT
    const token = generateJWT(user);

    logger.info('User logged in', { uid: user.uid, role: user.role });

    return success(res, {
      token,
      expiresIn: env.JWT_EXPIRES_IN,
      user:      formatUser(user),
    }, 'Login successful');
  } catch (err) {
    logger.error('Login error', { err: err.message });
    return error(res, 'Login failed — please try again');
  }
};


/**
 * GET /api/auth/me
 * Returns the currently authenticated user's profile.
 */
exports.getMe = async (req, res) => {
  try {
    const user = await User.findOne({ uid: req.user.uid });
    if (!user) return error(res, 'User not found', 404);
    return success(res, formatUser(user));
  } catch (err) {
    logger.error('getMe error', { err: err.message });
    return error(res);
  }
};


/**
 * PATCH /api/auth/me
 * Citizens and staff update their own profile.
 */
exports.updateMe = async (req, res) => {
  try {
    const allowed = ['name', 'phone', 'homeAddress', 'familyCount',
                     'notifyAlerts', 'notifySMS', 'language'];

    const updates = {};
    allowed.forEach(field => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    const user = await User.findOneAndUpdate(
      { uid: req.user.uid },
      updates,
      { new: true, runValidators: true }
    );

    if (!user) return error(res, 'User not found', 404);
    return success(res, formatUser(user), 'Profile updated');
  } catch (err) {
    logger.error('updateMe error', { err: err.message });
    return error(res);
  }
};


/**
 * PATCH /api/auth/set-role   [Admin only]
 * Set or change a user's role.
 */
exports.setRole = async (req, res) => {
  try {
    const { uid, role } = req.body;

    if (!uid || !role) {
      return badRequest(res, 'uid and role are required');
    }

    const validRoles = ['admin', 'coordinator', 'operator', 'field', 'citizen'];
    if (!validRoles.includes(role)) {
      return badRequest(res, `role must be one of: ${validRoles.join(', ')}`);
    }

    const user = await User.findOneAndUpdate(
      { uid },
      { role },
      { new: true }
    );

    if (!user) return error(res, 'User not found', 404);

    logger.info('Role updated', {
      targetUid: uid,
      newRole:   role,
      updatedBy: req.user.uid,
    });

    return success(res, formatUser(user), `Role updated to ${role}`);
  } catch (err) {
    logger.error('setRole error', { err: err.message });
    return error(res);
  }
};


/**
 * PATCH /api/auth/fcm-token
 * Update FCM token for push notifications.
 */
exports.updateFCMToken = async (req, res) => {
  try {
    const { fcmToken } = req.body;
    if (!fcmToken) return badRequest(res, 'fcmToken is required');

    await User.updateOne({ uid: req.user.uid }, { fcmToken });
    return success(res, null, 'FCM token updated');
  } catch (err) {
    logger.error('updateFCMToken error', { err: err.message });
    return error(res);
  }
};


/**
 * GET /api/auth/users   [Admin only]
 * List all users.
 */
exports.listUsers = async (req, res) => {
  try {
    const { role, page = 1, limit = 50 } = req.query;
    const filter = {};
    if (role) filter.role = role;

    const skip  = (parseInt(page) - 1) * parseInt(limit);
    const total = await User.countDocuments(filter);
    const users = await User.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    return success(res, users.map(formatUser), 'OK', 200, {
      total, page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / parseInt(limit)),
    });
  } catch (err) {
    logger.error('listUsers error', { err: err.message });
    return error(res);
  }
};


/**
 * PATCH /api/auth/users/:userId/deactivate   [Admin only]
 * Deactivate a user account.
 */
exports.deactivateUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.userId,
      { isActive: false },
      { new: true }
    );
    if (!user) return error(res, 'User not found', 404);

    // Also disable in Firebase Auth
    try {
      await getAuth().updateUser(user.uid, { disabled: true });
    } catch (fbErr) {
      logger.warn('Firebase disable failed (non-blocking)', { err: fbErr.message });
    }

    logger.info('User deactivated', { targetId: req.params.userId, by: req.user.uid });
    return success(res, null, 'User deactivated');
  } catch (err) {
    logger.error('deactivateUser error', { err: err.message });
    return error(res);
  }
};


/**
 * POST /api/auth/refresh
 * Issue a fresh JWT using the current (still valid) one.
 */
exports.refreshToken = async (req, res) => {
  try {
    const user = await User.findOne({ uid: req.user.uid });
    if (!user || !user.isActive) {
      return unauthorized(res, 'Account not found or deactivated');
    }
    const token = generateJWT(user);
    return success(res, { token, expiresIn: env.JWT_EXPIRES_IN }, 'Token refreshed');
  } catch (err) {
    logger.error('refreshToken error', { err: err.message });
    return error(res);
  }
};


/**
 * POST /api/auth/logout
 * Client-side logout — backend just acknowledges.
 * Token invalidation is handled by client discarding the token.
 */
exports.logout = async (req, res) => {
  try {
    // Clear FCM token on logout so no notifications to logged-out device
    await User.updateOne({ uid: req.user.uid }, { $unset: { fcmToken: 1 } });
    logger.info('User logged out', { uid: req.user.uid });
    return success(res, null, 'Logged out successfully');
  } catch (err) {
    logger.error('logout error', { err: err.message });
    return error(res);
  }
};
