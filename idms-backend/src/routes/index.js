const router = require('express').Router();

router.use('/auth',         require('./auth'));
router.use('/sensors',      require('./sensors'));
router.use('/alerts',       require('./alerts'));
router.use('/operations',   require('./operations'));
router.use('/drones',       require('./drones'));
router.use('/teams',        require('./teams'));
router.use('/camps',        require('./camps'));
router.use('/sos',          require('./sos'));
router.use('/purification', require('./purification'));
router.use('/prediction',   require('./prediction'));

module.exports = router;
