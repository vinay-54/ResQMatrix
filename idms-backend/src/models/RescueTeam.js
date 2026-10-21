const mongoose = require('mongoose');

const rescueTeamSchema = new mongoose.Schema({
  teamId: {
    type:   String,
    unique: true,
    trim:   true,
    index:  true,
    // e.g. "T-01"
  },
  name:    { type: String, required: true, trim: true },
  lead:    { type: String, required: true },
  members: { type: Number, default: 3, min: 1 },
  contact: { type: String, trim: true },

  status: {
    type:    String,
    enum:    ['deployed', 'standby', 'returning', 'off-duty'],
    default: 'standby',
    index:   true,
  },
  zone:    { type: String },
  vehicle: { type: String },
  task:    { type: String },

  // Current GPS location
  coords: {
    lat: { type: Number },
    lng: { type: Number },
  },

  // Linked sensor node for monitoring
  linkedNode: {
    type: String, // nodeId
  },

  // Current operation assignment
  assignedOperation: {
    type: mongoose.Schema.Types.ObjectId,
    ref:  'Operation',
  },

  skills:    [{ type: String }],
  equipment: [{ type: String }],

  isActive:   { type: Boolean, default: true },
  lastUpdate: { type: Date, default: Date.now },

}, { timestamps: true });

module.exports = mongoose.model('RescueTeam', rescueTeamSchema);
