const router = require('express').Router();

// GET /api/sensors
router.get('/', (req, res) => {
  res.json({ success: true, message: 'Sensors list — not yet implemented (Stage B5)' });
});

// GET /api/sensors/:id
router.get('/:id', (req, res) => {
  res.json({ success: true, message: `Sensor ${req.params.id} — not yet implemented` });
});

// POST /api/sensors/:id/data
router.post('/:id/data', (req, res) => {
  res.json({ success: true, message: 'Sensor data ingestion — not yet implemented' });
});

module.exports = router;
