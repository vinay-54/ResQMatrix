const router = require('express').Router();

router.get('/status', (req, res) => {
  res.json({ success: true, message: 'Purification status — not yet implemented' });
});

router.get('/history', (req, res) => {
  res.json({ success: true, message: 'Purification history — not yet implemented' });
});

module.exports = router;
