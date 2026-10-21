const mongoose = require('mongoose');

const droneSchema = new mongoose.Schema({
  droneId: {
    type:     String,
    required: true,
    unique:   true,
    index:    true,
    // e.g. "DR-001"
  },
  model:        { type: String, default: 'RoboMonk 450mm Quad-X' },
  serialNumber: { type: String },

  status: {
    type:    String,
    enum:    ['standby', 'preflight', 'airborne', 'returning', 'offline', 'charging', 'maintenance'],
    default: 'standby',
    index:   true,
  },

  // Live telemetry — updated by MQTT on every packet
  // Matches exact RoboMonk MQTT payload fields
  telemetry: {
    lat:              { type: Number },
    lng:              { type: Number },
    altitude:         { type: Number, default: 0   },   // metres AGL
    batteryPct:       { type: Number, default: 100 },   // %
    flightMode: {
      type: String,
      enum: ['STABILIZE', 'LOITER', 'AUTO', 'RTL', 'LAND', 'GUIDED'],
      default: 'STABILIZE',
    },
    connectionStatus: {
      type:    String,
      enum:    ['connected', 'weak', 'disconnected'],
      default: 'disconnected',
    },
    rssi:        { type: Number },
    groundSpeed: { type: Number, default: 0 }, // m/s
    heading:     { type: Number, default: 0 }, // degrees
    lastSeen:    { type: Date },
  },

  // Mission assignment — set by admin
  missionStatus: {
    type:    String,
    enum:    ['idle', 'assigned', 'active', 'completed'],
    default: 'idle',
  },
  assignedOperation: {
    type: mongoose.Schema.Types.ObjectId,
    ref:  'Operation',
  },
  assignedOperator: {
    type: mongoose.Schema.Types.ObjectId,
    ref:  'User',
  },

  // Hardware specs — RoboMonk confirmed values
  specs: {
    frameSize:    { type: String, default: '450mm Quad-X'            },
    material:     { type: String, default: 'Carbon fibre / Aluminium' },
    motors:       { type: String, default: 'A2212 1800KV × 4'        },
    escs:         { type: String, default: '30A × 4'                 },
    propellers:   { type: String, default: '1045 × 4'                },
    battery:      { type: String, default: '3S 11.1V 5200mAh 40C'    },
    flightTime:   { type: String, default: '12–18 min (target)'       },
    maxPayload:   { type: String, default: '300–500g (unverified)'    },
    fc:           { type: String, default: 'Pixhawk 2.4.8'           },
    firmware:     { type: String, default: 'ArduCopter'               },
    rc:           { type: String, default: 'FlySky FS-i6S 2.4GHz'    },
    video:        { type: String, default: '5.8GHz FPV → Controller'  },
  },

  // DGCA compliance
  dgca: {
    category:   { type: String, default: 'Micro' },
    uinNumber:  { type: String },
    registered: { type: Boolean, default: false },
  },

  // Video integration — false by design (v1 architecture decision)
  videoStreamUrl: { type: String, default: null  },
  videoEnabled:   { type: Boolean, default: false },

  // Deployment history
  deployments: [{
    operationId:       { type: mongoose.Schema.Types.ObjectId, ref: 'Operation' },
    operatorId:        { type: mongoose.Schema.Types.ObjectId, ref: 'User'      },
    startTime:         { type: Date },
    endTime:           { type: Date },
    flightDurationMin: { type: Number },
    notes:             { type: String },
  }],

  isActive: { type: Boolean, default: true },

}, { timestamps: true });

module.exports = mongoose.model('Drone', droneSchema);
