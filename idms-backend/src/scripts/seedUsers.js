/**
 * Run this ONCE to create the initial admin and demo users in Firebase Auth
 * and MongoDB. Run with: node src/scripts/seedUsers.js
 */
require('dotenv').config();
const { initFirebase, getAuth } = require('../config/firebase');
const { connectMongoDB }        = require('../config/mongodb');
const User                      = require('../models/User');
const logger                    = require('../utils/logger');

const SEED_USERS = [
  {
    email:    'admin@idms.svce.in',
    password: 'idms2025',
    name:     'Vinay Kumar',
    role:     'admin',
  },
  {
    email:    'coord@idms.svce.in',
    password: 'coord2025',
    name:     'Geethika Reddy',
    role:     'coordinator',
  },
  {
    email:    'operator@idms.svce.in',
    password: 'operator2025',
    name:     'Thimme Gowd',
    role:     'operator',
  },
  {
    email:    'user@idms.in',
    password: 'user2025',
    name:     'Ravi Kumar',
    role:     'citizen',
  },
];

const seed = async () => {
  try {
    initFirebase();
    await connectMongoDB();
    logger.info('Starting user seed...');

    for (const u of SEED_USERS) {
      try {
        // Create in Firebase Auth (or get existing)
        let firebaseUser;
        try {
          firebaseUser = await getAuth().createUser({
            email:         u.email,
            password:      u.password,
            displayName:   u.name,
            emailVerified: true,
          });
          logger.info(`Firebase user created: ${u.email}`);
        } catch (fbErr) {
          if (fbErr.code === 'auth/email-already-exists') {
            firebaseUser = await getAuth().getUserByEmail(u.email);
            logger.info(`Firebase user already exists: ${u.email}`);
          } else throw fbErr;
        }

        // Create in MongoDB (or update if exists)
        await User.findOneAndUpdate(
          { uid: firebaseUser.uid },
          {
            uid:   firebaseUser.uid,
            email: u.email,
            name:  u.name,
            role:  u.role,
          },
          { upsert: true, new: true, runValidators: true }
        );
        logger.info(`MongoDB user upserted: ${u.email} — role: ${u.role}`);
      } catch (userErr) {
        logger.error(`Failed to seed ${u.email}`, { err: userErr.message });
      }
    }

    logger.info('✅ Seed complete');
    process.exit(0);
  } catch (err) {
    logger.error('Seed failed', { err: err.message });
    process.exit(1);
  }
};

seed();
