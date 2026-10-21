const router = require('express').Router();

router.get('/', (req, res) => {
  res.json({ success: true, message: 'Operations list — not yet implemented' });
});

router.post('/', (req, res) => {
  res.json({ success: true, message: 'Create operation — not yet implemented' });
});

router.get('/:id', (req, res) => {
  res.json({ success: true, message: `Operation ${req.params.id} — not yet implemented` });
});

module.exports = router;
