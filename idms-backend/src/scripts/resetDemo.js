/**
 * IDMS — Reset Demo State
 *
 * Resets the database to a clean, visually interesting demo state
 * before presentations (e.g. JNTUA review).
 *
 * Usage: node src/scripts/resetDemo.js
 *
 * What it does:
 *   - Sets DSN-001 to WARNING level (22cm) — most visually interesting
 *   - Clears old SOS incidents (> 24h)
 *   - Creates 2 fresh unacknowledged alerts
 *   - Syncs Firebase RTDB to match
 *
 * Requires: MONGODB_URI + Firebase creds in .env
 */
require('dotenv').config();
const { connectMongoDB, disconnectMongoDB } = require('../config/mongodb');
const { SensorNode, Alert, SOSIncident } = require('../models');
const { initFirebase }  = require('../config/firebase');
const logger            = require('../utils/logger');

const reset = async () => {
  try {
    await connectMongoDB();
    initFirebase();

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  IDMS — Reset Demo State');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // 1. Set DSN-001 to WARNING level — most visually interesting for demo
    const node = await SensorNode.findOneAndUpdate(
      { nodeId: 'DSN-001' },
      {
        alertLevel: 'WARNING',
        status:     'online',
        lastSeen:   new Date(),
        latest: {
          waterLevel:   22,
          temperature:  28.4,
          humidity:     78.2,
          pressure:     1012,
          rainfall:     true,
          battery:      87,
          commLayer:    '4G',
          receivedAt:   new Date(),
        },
      },
      { new: true }
    );

    if (node) {
      console.log('  ✅ DSN-001 set to WARNING at 22cm');
    } else {
      console.log('  ⚠️  DSN-001 not found — run seedUsers first');
    }

    // 2. Clear old SOS incidents (> 24 hours)
    const sosResult = await SOSIncident.deleteMany({
      timestamp: { $lt: new Date(Date.now() - 86400000) },
    });
    console.log(`  ✅ Cleared ${sosResult.deletedCount} old SOS incidents`);

    // 3. Mark all existing alerts as acknowledged, then create fresh ones
    await Alert.updateMany({}, { acknowledged: true });

    await Alert.create([
      {
        nodeId:         'DSN-001',
        nodeName:       'River Bridge East',
        level:          'WARNING',
        message:        'River Bridge East: water level 22cm — WARNING',
        citizenMessage: 'Water level is rising fast at River Bridge East',
        waterLevel:     22,
        channels:       ['FCM'],
        acknowledged:   false,
        timestamp:      new Date(),
      },
      {
        nodeId:         'DSN-002',
        nodeName:       'Parking Area North',
        level:          'WATCH',
        message:        'Parking Area North: water level 38cm — WATCH',
        citizenMessage: 'Water level is increasing at Parking Area North',
        waterLevel:     38,
        channels:       [],
        acknowledged:   false,
        timestamp:      new Date(Date.now() - 300000),
      },
    ]);
    console.log('  ✅ Created 2 fresh unacknowledged alerts');

    // 4. Sync Firebase RTDB to match
    try {
      const { seedFromMongoDB, updateAlertCount } = require('../services/firebaseService');
      await seedFromMongoDB();
      await updateAlertCount(2);
      console.log('  ✅ Firebase RTDB synced');
    } catch (err) {
      console.log(`  ⚠️  Firebase sync skipped: ${err.message}`);
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  ✅ Demo state reset complete');
    console.log('     DSN-001: WARNING at 22cm');
    console.log('     2 unacknowledged alerts');
    console.log('     Ready for presentation');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    await disconnectMongoDB();
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Demo reset failed:', err.message);
    process.exit(1);
  }
};

reset();
