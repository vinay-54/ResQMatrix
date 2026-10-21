const mongoose = require('mongoose');

const operationSchema = new mongoose.Schema({
  operationId: {
    type:   String,
    unique: true,
    trim:   true,
    index:  true,
    // e.g. "OP-001"
  },
  name:        { type: String, required: true, trim: true },
  description: { type: String },
  type: {
    type: String,
    enum: ['Flood', 'Cyclone', 'Fire', 'Earthquake', 'Monitoring', 'Relief', 'Other'],
    default: 'Flood',
  },
  status: {
    type:    String,
    enum:    ['planned', 'active', 'standby', 'completed', 'cancelled'],
    default: 'active',
    index:   true,
  },
  priority: {
    type:    String,
    enum:    ['low', 'medium', 'high', 'critical'],
    default: 'medium',
  },

  // Location
  location: { type: String, trim: true },
  lat:       { type: Number },
  lng:       { type: Number },

  // Assignments
  assignedTeams: [{
    type: mongoose.Schema.Types.ObjectId,
    ref:  'RescueTeam',
  }],
  assignedResources: [{ type: String }],

  // Linked SOS incidents
  linkedSOS: [{
    type: mongoose.Schema.Types.ObjectId,
    ref:  'SOSIncident',
  }],

  // Timeline
  startTime: { type: Date, default: Date.now },
  endTime:   { type: Date },

  // Created by
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  isActive: { type: Boolean, default: true },

}, { timestamps: true });

operationSchema.index({ status: 1, priority: 1 });

module.exports = mongoose.model('Operation', operationSchema);
