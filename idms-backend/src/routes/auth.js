const router = require('express').Router();
const ctrl   = require('../controllers/authController');
const { verifyJWT, verifyFirebaseToken } = require('../middleware/auth');
const { adminOnly } = require('../middleware/rbac');
const { authLimiter } = require('../middleware/rateLimiter');

// ── Public routes (rate limited) ──────────────────────────────────────────
// POST /api/auth/login
// Receives Firebase ID token → returns our JWT
router.post('/login',
  authLimiter,
  verifyFirebaseToken,
  ctrl.login
);

// ── Protected routes (require our JWT) ───────────────────────────────────
// GET   /api/auth/me         → get own profile
// PATCH /api/auth/me         → update own profile
// POST  /api/auth/refresh    → get fresh token
// POST  /api/auth/logout     → logout
// PATCH /api/auth/fcm-token  → update FCM token
router.get   ('/me',        verifyJWT, ctrl.getMe);
router.patch ('/me',        verifyJWT, ctrl.updateMe);
router.post  ('/refresh',   verifyJWT, ctrl.refreshToken);
router.post  ('/logout',    verifyJWT, ctrl.logout);
router.patch ('/fcm-token', verifyJWT, ctrl.updateFCMToken);

// ── Admin-only routes ─────────────────────────────────────────────────────
// GET   /api/auth/users                      → list all users
// PATCH /api/auth/set-role                   → change a user's role
// PATCH /api/auth/users/:userId/deactivate   → deactivate account
router.get   ('/users',                    verifyJWT, adminOnly, ctrl.listUsers);
router.patch ('/set-role',                 verifyJWT, adminOnly, ctrl.setRole);
router.patch ('/users/:userId/deactivate', verifyJWT, adminOnly, ctrl.deactivateUser);

module.exports = router;
