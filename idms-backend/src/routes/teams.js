const router = require('express').Router();
const ctrl   = require('../controllers/teamController');
const { verifyJWT }       = require('../middleware/auth');
const { adminOrOperator, staffOnly } = require('../middleware/rbac');

router.get   ('/',        verifyJWT, staffOnly,       ctrl.getAll);
router.get   ('/:teamId', verifyJWT, staffOnly,       ctrl.getOne);
router.post  ('/',        verifyJWT, adminOrOperator, ctrl.create);
router.patch ('/:teamId', verifyJWT, adminOrOperator, ctrl.update);
router.delete('/:teamId', verifyJWT, adminOrOperator, ctrl.remove);

module.exports = router;
