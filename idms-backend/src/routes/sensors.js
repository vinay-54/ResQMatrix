const router = require('express').Router();
const ctrl   = require('../controllers/sensorController');
const { verifyJWT }       = require('../middleware/auth');
const { adminOrOperator, staffOnly } = require('../middleware/rbac');

// Public read — citizens can read sensor data
router.get('/stats/summary', verifyJWT,              ctrl.getSummary);
router.get('/',              verifyJWT,              ctrl.getAll);
router.get('/:nodeId',       verifyJWT,              ctrl.getOne);
router.get('/:nodeId/readings', verifyJWT,           ctrl.getReadings);

// Write — admin/coordinator/operator only
router.post  ('/',        verifyJWT, adminOrOperator, ctrl.create);
router.patch ('/:nodeId', verifyJWT, adminOrOperator, ctrl.update);
router.delete('/:nodeId', verifyJWT, adminOrOperator, ctrl.remove);

module.exports = router;
