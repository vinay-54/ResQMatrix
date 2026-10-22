const router = require('express').Router();
const ctrl   = require('../controllers/operationController');
const { verifyJWT }       = require('../middleware/auth');
const { adminOrOperator, staffOnly } = require('../middleware/rbac');

router.get   ('/',              verifyJWT, staffOnly,       ctrl.getAll);
router.get   ('/:operationId',  verifyJWT, staffOnly,       ctrl.getOne);
router.post  ('/',              verifyJWT, adminOrOperator, ctrl.create);
router.patch ('/:operationId',  verifyJWT, adminOrOperator, ctrl.update);
router.delete('/:operationId',  verifyJWT, adminOrOperator, ctrl.remove);

module.exports = router;
