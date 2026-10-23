const express      = require('express');
const cors         = require('cors');
const helmet       = require('helmet');
const compression  = require('compression');
const morgan       = require('morgan');
const env          = require('./config/env');
const logger       = require('./utils/logger');
const errorHandler = require('./middleware/errorHandler');
const { apiLimiter } = require('./middleware/rateLimiter');
const routes       = require('./routes');

const app = express();

// ── Security ──────────────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin:      [env.FRONTEND_URL, 'http://localhost:5173', 'http://localhost:4173'],
  credentials: true,
  methods:     ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ── Performance ───────────────────────────────────────────────────────────
app.use(compression());

// ── Parsing ───────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Logging ───────────────────────────────────────────────────────────────
app.use(morgan('combined', {
  stream: { write: msg => logger.info(msg.trim()) },
  skip:   (req) => req.path === '/health',
}));

// ── Rate limiting ─────────────────────────────────────────────────────────
app.use('/api/', apiLimiter);

// ── Health check ─────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    status:    'healthy',
    service:   'ResQMatrix Backend',
    version:   '1.0.0',
    timestamp: new Date().toISOString(),
    env:       env.NODE_ENV,
  });
});

// ── API Routes ────────────────────────────────────────────────────────────
app.use('/api', routes);

// ── 404 Handler ───────────────────────────────────────────────────────────
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`,
  });
});

// ── Global Error Handler ──────────────────────────────────────────────────
app.use(errorHandler);

module.exports = app;
