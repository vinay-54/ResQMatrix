const router = require('express').Router();
const ctrl   = require('../controllers/alertController');
const { verifyJWT }       = require('../middleware/auth');
const { adminOrOperator, citizenOrAbove } = require('../middleware/rbac');

router.get   ('/',                verifyJWT, citizenOrAbove,  ctrl.getAll);
router.get   ('/:id',            verifyJWT, citizenOrAbove,  ctrl.getOne);
router.post  ('/',                verifyJWT, adminOrOperator, ctrl.create);
router.patch ('/acknowledge-all', verifyJWT, adminOrOperator, ctrl.acknowledgeAll);
router.patch ('/:id/acknowledge', verifyJWT, adminOrOperator, ctrl.acknowledge);
router.delete('/:id',            verifyJWT, adminOrOperator, ctrl.remove);

module.exports = router;
