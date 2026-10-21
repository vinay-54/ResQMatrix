const router = require('express').Router();

router.get('/latest', (req, res) => {
  res.json({ success: true, message: 'Latest prediction — not yet implemented' });
});

router.post('/run', (req, res) => {
  res.json({ success: true, message: 'Run prediction — not yet implemented' });
});

module.exports = router;
