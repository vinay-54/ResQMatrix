const router = require('express').Router();

router.get('/', (req, res) => {
  res.json({ success: true, message: 'Camps list — not yet implemented' });
});

router.post('/', (req, res) => {
  res.json({ success: true, message: 'Create camp — not yet implemented' });
});

module.exports = router;
