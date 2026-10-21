const jwt            = require('jsonwebtoken');
const { getAuth }    = require('../config/firebase');
const User           = require('../models/User');
const { unauthorized, forbidden } = require('../utils/apiResponse');
const logger         = require('../utils/logger');
const env            = require('../config/env');

/**
 * verifyJWT
 * Verifies the JWT issued by this backend.
 * Attaches req.user = { uid, email, role, userId }
 * Use this on every protected route.
 */
const verifyJWT = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return unauthorized(res, 'No token provided');
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, env.JWT_SECRET);

    // Attach user info to request — no DB call here for performance
    req.user = {
      uid:    decoded.uid,
      email:  decoded.email,
      role:   decoded.role,
      userId: decoded.userId, // MongoDB _id
    };

    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return unauthorized(res, 'Session expired — please sign in again');
    }
    if (err.name === 'JsonWebTokenError') {
      return unauthorized(res, 'Invalid token');
    }
    logger.error('JWT verification error', { err: err.message });
    return unauthorized(res, 'Authentication failed');
  }
};

/**
 * verifyFirebaseToken
 * Verifies a Firebase ID token (used only on the /auth/login endpoint).
 * This is the entry point — after this, our own JWT is used.
 * Attaches req.firebaseUser = Firebase decoded token.
 */
const verifyFirebaseToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return unauthorized(res, 'No Firebase token provided');
    }

    const idToken = authHeader.split(' ')[1];
    const decoded = await getAuth().verifyIdToken(idToken);

    req.firebaseUser = decoded;
    next();
  } catch (err) {
    logger.error('Firebase token verification failed', { err: err.message });
    return unauthorized(res, 'Invalid or expired Firebase token');
  }
};

/**
 * optionalAuth
 * Attaches req.user if a valid JWT is present but does not block
 * the request if no token is provided.
 * Use on routes that have different behavior for auth vs unauth users.
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      req.user = null;
      return next();
    }
    const token   = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, env.JWT_SECRET);
    req.user = decoded;
  } catch {
    req.user = null;
  }
  next();
};

module.exports = { verifyJWT, verifyFirebaseToken, optionalAuth };
