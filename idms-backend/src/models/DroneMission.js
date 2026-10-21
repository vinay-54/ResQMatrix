const mongoose = require('mongoose');

const droneMissionSchema = new mongoose.Schema({
  missionRef: {
    type:   String,
    unique: true,
    index:  true,
  },

  droneId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Drone',     required: true },
  operation: { type: mongoose.Schema.Types.ObjectId, ref: 'Operation', required: true },
  operator:  { type: mongoose.Schema.Types.ObjectId, ref: 'User'                     },

  status: {
    type:    String,
    enum:    ['planned', 'preflight', 'active', 'completed', 'aborted'],
    default: 'planned',
    index:   true,
  },

  // Preflight checklist completion
  preflightCompleted: { type: Boolean, default: false },
  preflightItems: [{
    itemId:      { type: String },
    check:       { type: String },
    completed:   { type: Boolean, default: false },
    completedAt: { type: Date },
  }],

  // Flight data
  startTime:         { type: Date },
  endTime:           { type: Date },
  flightDurationMin: { type: Number },
  maxAltitude:       { type: Number }, // metres
  distanceCovered:   { type: Number }, // km
  batteryStart:      { type: Number }, // %
  batteryEnd:        { type: Number }, // %

  // GPS flight path — array of positions logged during flight
  flightPath: [{
    lat:       { type: Number },
    lng:       { type: Number },
    altitude:  { type: Number },
    timestamp: { type: Date   },
  }],

  objectives: { type: String },
  outcome:    { type: String },
  notes:      { type: String },

}, { timestamps: true });

module.exports = mongoose.model('DroneMission', droneMissionSchema);
