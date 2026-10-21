const mongoose = require('mongoose');

// Separate collection from Alert — SOS has a full lifecycle
const sosIncidentSchema = new mongoose.Schema({
  // Reference
  alertId: { type: mongoose.Schema.Types.ObjectId, ref: 'Alert' },
  incidentRef: {
    type: String,
    unique: true,
    // e.g. "SOS-1729123456789" — shown to citizen
  },

  // Source
  sourceType: {
    type: String,
    enum: ['PHYSICAL_DEVICE', 'WEB_PORTAL'],
    required: true,
  },
  deviceId: { type: String },
  // For web SOS:
  reportedBy:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reporterName:  { type: String },
  reporterPhone: { type: String },

  // Location
  location: {
    lat:      { type: Number, required: true },
    lng:      { type: Number, required: true },
    accuracy: { type: Number }, // metres
    address:  { type: String }, // reverse geocoded
  },

  // Lifecycle status
  status: {
    type:    String,
    enum:    ['CREATED', 'RECEIVED', 'ACKNOWLEDGED', 'DISPATCHED', 'IN_PROGRESS', 'RESOLVED', 'CANCELLED'],
    default: 'CREATED',
    index:   true,
  },
  statusHistory: [{
    status:    { type: String },
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    note:      { type: String },
    changedAt: { type: Date, default: Date.now },
  }],

  // Response
  assignedTeam:   { type: mongoose.Schema.Types.ObjectId, ref: 'RescueTeam' },
  assignedAt:     { type: Date },
  respondedAt:    { type: Date },
  resolvedAt:     { type: Date },
  resolutionNote: { type: String },

  // Device data at time of SOS
  deviceData: {
    battery:        { type: Number },
    network:        { type: String },
    signalStrength: { type: Number },
    fallDetected:   { type: Boolean },
  },

  priority: {
    type:    String,
    enum:    ['low', 'medium', 'high', 'critical'],
    default: 'high',
  },

  notes:     { type: String },
  timestamp: { type: Date, default: Date.now, index: true },

}, { timestamps: true });

sosIncidentSchema.index({ status: 1, timestamp: -1 });
sosIncidentSchema.index({ 'location.lat': 1, 'location.lng': 1 });

module.exports = mongoose.model('SOSIncident', sosIncidentSchema);
