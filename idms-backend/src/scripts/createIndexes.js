/**
 * IDMS — Create MongoDB Indexes
 * 
 * Run once after first deploy to ensure optimal query performance.
 * Usage: node src/scripts/createIndexes.js
 * 
 * Requires: MONGODB_URI in .env
 */
require('dotenv').config();
const { connectMongoDB, disconnectMongoDB } = require('../config/mongodb');
const {
  SensorNode,
  SensorReading,
  Alert,
  SOSIncident,
  User,
  RescueCamp,
  RescueTeam,
  Drone,
  DroneMission,
  Operation,
  Purification,
  SafetyReport,
  DangerZone,
} = require('../models');

const createIndexes = async () => {
  try {
    await connectMongoDB();
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  IDMS — Creating MongoDB Indexes');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const models = [
      { name: 'SensorNode',    model: SensorNode    },
      { name: 'SensorReading', model: SensorReading },
      { name: 'Alert',         model: Alert         },
      { name: 'SOSIncident',   model: SOSIncident   },
      { name: 'User',          model: User          },
      { name: 'RescueCamp',    model: RescueCamp    },
      { name: 'RescueTeam',    model: RescueTeam    },
      { name: 'Drone',         model: Drone         },
      { name: 'DroneMission',  model: DroneMission  },
      { name: 'Operation',     model: Operation     },
      { name: 'Purification',  model: Purification  },
      { name: 'SafetyReport',  model: SafetyReport  },
      { name: 'DangerZone',    model: DangerZone    },
    ];

    for (const { name, model } of models) {
      try {
        await model.createIndexes();
        const indexes = await model.listIndexes();
        console.log(`  ✅ ${name.padEnd(16)} — ${indexes.length} indexes`);
      } catch (err) {
        console.log(`  ❌ ${name.padEnd(16)} — ${err.message}`);
      }
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  ✅ All indexes created successfully');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    await disconnectMongoDB();
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Index creation failed:', err.message);
    process.exit(1);
  }
};

createIndexes();
