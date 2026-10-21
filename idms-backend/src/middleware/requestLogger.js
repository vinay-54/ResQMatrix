const logger = require('../utils/logger');

const requestLogger = (req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const level = res.statusCode >= 400 ? 'warn' : 'info';

    logger[level](`${req.method} ${req.originalUrl}`, {
      status:   res.statusCode,
      duration: `${duration}ms`,
      ip:       req.ip,
      userAgent: req.get('user-agent')?.substring(0, 80),
    });
  });

  next();
};

module.exports = requestLogger;
