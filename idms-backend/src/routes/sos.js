const router = require('express').Router();
const { sosLimiter } = require('../middleware/rateLimiter');

// Rate limit SOS endpoints
router.use(sosLimiter);

router.post('/', (req, res) => {
  res.json({ success: true, message: 'SOS submission — not yet implemented' });
});

router.get('/', (req, res) => {
  res.json({ success: true, message: 'SOS list — not yet implemented' });
});

module.exports = router;
