const { SensorNode } = require('../models');
const firebaseService = require('../services/firebaseService');
const logger          = require('../utils/logger');

// Run every 2 minutes — mark nodes offline if no packet in 3 minutes
const OFFLINE_THRESHOLD_MS = 3 * 60 * 1000; // 3 minutes

exports.startOfflineDetector = (io) => {
  const job = setInterval(async () => {
    try {
      const cutoff = new Date(Date.now() - OFFLINE_THRESHOLD_MS);

      const staleNodes = await SensorNode.find({
        isActive: true,
        status:   'online',
        lastSeen: { $lt: cutoff },
      });

      for (const node of staleNodes) {
        await SensorNode.findByIdAndUpdate(node._id, { status: 'offline' });
        await firebaseService.markNodeOffline(node.nodeId);

        if (io) {
          io.to('admin-room').emit('sensor:offline', {
            nodeId:    node.nodeId,
            name:      node.name,
            lastSeen:  node.lastSeen,
            timestamp: Date.now(),
          });
        }

        logger.warn('Node marked offline — no data received', {
          nodeId:   node.nodeId,
          lastSeen: node.lastSeen,
        });
      }

      if (staleNodes.length > 0) {
        const onlineCount = await SensorNode.countDocuments({
          isActive: true, status: 'online',
        });
        await firebaseService.updateSystemStatus({ onlineNodeCount: onlineCount });
      }
    } catch (err) {
      logger.error('Offline detector error', { err: err.message });
    }
  }, 2 * 60 * 1000); // every 2 minutes

  logger.info('Offline detector started — checking every 2 minutes');
  return job;
};
