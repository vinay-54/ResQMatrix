const app    = require('./src/app');
const env    = require('./src/config/env');
const logger = require('./src/utils/logger');
const { connectMongoDB }  = require('./src/config/mongodb');
const { initFirebase }    = require('./src/config/firebase');
const { connectMQTT }     = require('./src/config/mqtt');
const http       = require('http');
const { Server } = require('socket.io');

const server = http.createServer(app);

// Socket.io for real-time frontend updates
const io = new Server(server, {
  cors: {
    origin:  [env.FRONTEND_URL, 'http://localhost:5173'],
    methods: ['GET', 'POST'],
  },
});

// Make io available to controllers via app
app.set('io', io);

io.on('connection', (socket) => {
  logger.info('Client connected via Socket.io', { id: socket.id });

  socket.on('join:admin', () => socket.join('admin-room'));
  socket.on('join:user',  () => socket.join('user-room'));

  socket.on('disconnect', () => {
    logger.info('Client disconnected', { id: socket.id });
  });
});

// ── Startup sequence ─────────────────────────────────────────────────────
const start = async () => {
  try {
    logger.info('🚀 Starting IDMS Backend...');

    // 1. Connect MongoDB (will fail with placeholder URI — expected)
    try {
      await connectMongoDB();
      logger.info('✅ MongoDB Atlas connected');
    } catch (err) {
      logger.warn('⚠️  MongoDB connection failed (expected with placeholder URI)', {
        error: err.message,
      });
    }

    // 2. Init Firebase Admin (will fail with placeholder creds — expected)
    try {
      initFirebase();
      logger.info('✅ Firebase Admin SDK initialized');

      // 3. Seed Firebase RTDB with current MongoDB state
      const { seedFromMongoDB } = require('./src/services/firebaseService');
      await seedFromMongoDB();
      logger.info('✅ Firebase RTDB seeded with current data');
    } catch (err) {
      logger.warn('⚠️  Firebase init/seed failed (expected with placeholder creds)', {
        error: err.message,
      });
    }

    // 3. Connect MQTT broker (will fail with placeholder URL — expected)
    try {
      await connectMQTT(app);
      logger.info('✅ HiveMQ MQTT connected');
    } catch (err) {
      logger.warn('⚠️  MQTT connection failed (expected with placeholder URL)', {
        error: err.message,
      });
    }

    // 4. Start HTTP server
    server.listen(env.PORT, () => {
      logger.info(`✅ Server running on port ${env.PORT}`);
      logger.info(`📡 Environment: ${env.NODE_ENV}`);
      logger.info(`🏥 Health: http://localhost:${env.PORT}/health`);
    });
  } catch (err) {
    logger.error('❌ Startup failed', { error: err.message });
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received — shutting down gracefully');
  server.close(() => process.exit(0));
});

start();
