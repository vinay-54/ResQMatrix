const router = require('express').Router();
const ctrl   = require('../controllers/campController');
const { verifyJWT }       = require('../middleware/auth');
const { adminOrOperator, citizenOrAbove } = require('../middleware/rbac');

router.get   ('/',        verifyJWT, citizenOrAbove,  ctrl.getAll);
router.get   ('/:campId', verifyJWT, citizenOrAbove,  ctrl.getOne);
router.post  ('/',        verifyJWT, adminOrOperator, ctrl.create);
router.patch ('/:campId', verifyJWT, adminOrOperator, ctrl.update);
router.delete('/:campId', verifyJWT, adminOrOperator, ctrl.remove);

module.exports = router;
