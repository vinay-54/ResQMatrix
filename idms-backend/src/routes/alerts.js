const router = require('express').Router();

router.get('/', (req, res) => {
  res.json({ success: true, message: 'Alerts list — not yet implemented' });
});

router.patch('/:id/acknowledge', (req, res) => {
  res.json({ success: true, message: `Alert ${req.params.id} acknowledge — not yet implemented` });
});

module.exports = router;
