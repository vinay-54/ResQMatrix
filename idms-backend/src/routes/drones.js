const router = require('express').Router();

router.get('/', (req, res) => {
  res.json({ success: true, message: 'Drones list — not yet implemented' });
});

router.get('/:id/telemetry', (req, res) => {
  res.json({ success: true, message: `Drone ${req.params.id} telemetry — not yet implemented` });
});

module.exports = router;
