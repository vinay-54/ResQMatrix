const router = require('express').Router();
const ctrl   = require('../controllers/sosController');
const { verifyJWT }       = require('../middleware/auth');
const { adminOrOperator, citizenOrAbove } = require('../middleware/rbac');
const { sosLimiter }      = require('../middleware/rateLimiter');

router.post  ('/',                     sosLimiter, verifyJWT, citizenOrAbove,  ctrl.create);
router.get   ('/',                                verifyJWT, citizenOrAbove,  ctrl.getAll);
router.get   ('/:incidentRef',                    verifyJWT, citizenOrAbove,  ctrl.getOne);
router.patch ('/:incidentRef/status',             verifyJWT, adminOrOperator, ctrl.updateStatus);

module.exports = router;
