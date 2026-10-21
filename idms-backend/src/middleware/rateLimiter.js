const rateLimit = require('express-rate-limit');

// General API rate limit
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max:      200,
  message:  { success: false, message: 'Too many requests — try again later' },
  standardHeaders: true,
  legacyHeaders:   false,
});

// Strict limit for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max:      10,
  message:  { success: false, message: 'Too many auth attempts — try again later' },
});

// Very strict for SOS — never block genuine SOS
const sosLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max:      5,
  message:  { success: false, message: 'Too many SOS requests' },
});

module.exports = { apiLimiter, authLimiter, sosLimiter };
