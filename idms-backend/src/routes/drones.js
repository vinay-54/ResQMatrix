const router = require('express').Router();
const ctrl   = require('../controllers/droneController');
const { verifyJWT }       = require('../middleware/auth');
const { adminOrOperator, staffOnly } = require('../middleware/rbac');

router.get   ('/',                    verifyJWT, staffOnly,       ctrl.getAll);
router.get   ('/:droneId',            verifyJWT, staffOnly,       ctrl.getOne);
router.post  ('/',                    verifyJWT, adminOrOperator, ctrl.create);
router.patch ('/:droneId',            verifyJWT, adminOrOperator, ctrl.update);
router.patch ('/:droneId/telemetry',  verifyJWT, adminOrOperator, ctrl.updateTelemetry);
router.delete('/:droneId',            verifyJWT, adminOrOperator, ctrl.remove);

module.exports = router;
