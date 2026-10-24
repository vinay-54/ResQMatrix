const router = require('express').Router();
const ctrl   = require('../controllers/notificationController');
const { verifyJWT } = require('../middleware/auth');
const { adminOrOperator, citizenOrAbove } = require('../middleware/rbac');

// Subscribe to a topic (citizen calls this after granting notification permission)
router.post('/subscribe',    verifyJWT, citizenOrAbove,  ctrl.subscribe);
router.post('/unsubscribe',  verifyJWT, citizenOrAbove,  ctrl.unsubscribe);

// Test notification — admin only
router.post('/test',         verifyJWT, adminOrOperator, ctrl.sendTest);

// Update FCM token when it rotates
router.patch('/fcm-token',   verifyJWT, citizenOrAbove,  ctrl.updateToken);

module.exports = router;
