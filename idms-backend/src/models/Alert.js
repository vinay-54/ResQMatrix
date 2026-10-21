const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
  // Source
  nodeId: {
    type:  String,
    index: true,
    // null for system-generated alerts not tied to a node
  },
  nodeName:  { type: String },
  readingId: { type: mongoose.Schema.Types.ObjectId, ref: 'SensorReading' },

  // Alert content
  level: {
    type:     String,
    enum:     ['SAFE', 'WATCH', 'WARNING', 'DANGER', 'CRITICAL', 'SYSTEM'],
    required: true,
    index:    true,
  },
  message: {
    type:     String,
    required: true,
    // Technical message for admins
  },
  detail: {
    type: String,
    // Extended detail for alert center
  },
  citizenMessage: {
    type: String,
    // Plain language version shown in User Portal
  },

  // Reading snapshot at time of alert
  waterLevel:  { type: Number },
  threshold:   { type: Number }, // which threshold was crossed

  // Notification channels triggered
  channels: [{
    type: String,
    enum: ['FCM', 'SMS', 'MQTT', 'EMAIL'],
  }],
  notificationSent:   { type: Boolean, default: false },
  notificationSentAt: { type: Date },

  // Lifecycle
  acknowledged:   { type: Boolean, default: false, index: true },
  acknowledgedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  acknowledgedAt: { type: Date },

  // SOS flag
  isSOS:       { type: Boolean, default: false, index: true },
  sosLocation: {
    lat:      { type: Number },
    lng:      { type: Number },
    accuracy: { type: Number },
  },

  // Geolocation of alert source
  lat: { type: Number },
  lng: { type: Number },

  timestamp: {
    type:    Date,
    default: Date.now,
    index:   true,
  },

}, { timestamps: true });

alertSchema.index({ level: 1, acknowledged: 1, timestamp: -1 });
alertSchema.index({ isSOS: 1, acknowledged: 1 });

module.exports = mongoose.model('Alert', alertSchema);
