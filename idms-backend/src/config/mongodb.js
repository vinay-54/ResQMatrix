const mongoose = require('mongoose');
const env      = require('./env');
const logger   = require('../utils/logger');

const connectMongoDB = async () => {
  const options = {
    maxPoolSize:        10,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS:    45000,
  };

  mongoose.connection.on('connected',    () => logger.info('MongoDB connected'));
  mongoose.connection.on('error',  err => logger.error('MongoDB error', { err: err.message }));
  mongoose.connection.on('disconnected', () => logger.warn('MongoDB disconnected'));

  await mongoose.connect(env.MONGODB_URI, options);
};

const disconnectMongoDB = async () => {
  await mongoose.connection.close();
  logger.info('MongoDB connection closed');
};

module.exports = { connectMongoDB, disconnectMongoDB };
