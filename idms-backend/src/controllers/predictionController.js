const axios  = require('axios');
const { success, error, badRequest } = require('../utils/apiResponse');
const logger = require('../utils/logger');
const env    = require('../config/env');

const ML_URL = env.ML_SERVICE_URL || 'http://localhost:5001';

// ── GET /api/prediction/:nodeId ───────────────────────────────────────────
exports.predictNode = async (req, res) => {
  try {
    const { nodeId } = req.params;
    const hours      = parseInt(req.query.hours || 24);

    if (hours < 1 || hours > 72) {
      return badRequest(res, 'hours must be between 1 and 72');
    }

    const response = await axios.get(
      `${ML_URL}/predict/${nodeId}`,
      {
        params:  { hours },
        timeout: 30000, // 30s — LSTM inference can be slow cold
      }
    );

    return success(res, response.data.data, 'Prediction retrieved', 200, {
      method: response.data.meta?.method,
      nodeId,
      hours,
    });
  } catch (err) {
    if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
      logger.error('ML service unreachable', { url: ML_URL });
      return error(res, 'Prediction service temporarily unavailable', 503);
    }
    logger.error('predictNode error', { err: err.message });
    return error(res, 'Prediction failed');
  }
};

// ── GET /api/prediction/all ───────────────────────────────────────────────
exports.predictAll = async (req, res) => {
  try {
    const hours = parseInt(req.query.hours || 24);

    const response = await axios.get(`${ML_URL}/predict/all`, {
      params:  { hours },
      timeout: 60000,
    });

    return success(res, response.data.data, 'Batch predictions retrieved', 200, {
      nodeCount: response.data.meta?.nodeCount,
      hours,
    });
  } catch (err) {
    if (err.code === 'ECONNREFUSED') {
      return error(res, 'Prediction service temporarily unavailable', 503);
    }
    logger.error('predictAll error', { err: err.message });
    return error(res);
  }
};

// ── GET /api/prediction/models ────────────────────────────────────────────
exports.listModels = async (req, res) => {
  try {
    const response = await axios.get(`${ML_URL}/models`, { timeout: 5000 });
    return success(res, response.data.data, 'Models retrieved');
  } catch (err) {
    return error(res, 'Could not reach prediction service', 503);
  }
};

// ── GET /api/prediction/health ────────────────────────────────────────────
exports.mlHealth = async (req, res) => {
  try {
    const response = await axios.get(`${ML_URL}/health`, { timeout: 5000 });
    return success(res, response.data, 'ML service healthy');
  } catch (err) {
    return error(res, 'ML service unreachable', 503);
  }
};
