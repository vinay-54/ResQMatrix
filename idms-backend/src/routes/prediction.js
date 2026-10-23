const router = require('express').Router();
const ctrl   = require('../controllers/predictionController');
const { verifyJWT } = require('../middleware/auth');
const { staffOnly, citizenOrAbove } = require('../middleware/rbac');

router.get('/health',        verifyJWT, staffOnly,       ctrl.mlHealth);
router.get('/models',        verifyJWT, staffOnly,       ctrl.listModels);
router.get('/all',           verifyJWT, staffOnly,       ctrl.predictAll);
router.get('/:nodeId',       verifyJWT, citizenOrAbove,  ctrl.predictNode);

module.exports = router;
