const router = require('express').Router();

router.get('/', (req, res) => {
  res.json({ success: true, message: 'Teams list — not yet implemented' });
});

router.post('/', (req, res) => {
  res.json({ success: true, message: 'Create team — not yet implemented' });
});

module.exports = router;
