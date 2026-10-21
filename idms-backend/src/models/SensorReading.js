const mongoose = require('mongoose');

// Time-series collection — one document per MQTT packet received
// High write volume — keep lean, use TTL index to auto-expire old data
const sensorReadingSchema = new mongoose.Schema({
  nodeId: {
    type:     String,
    required: true,
    index:    true,
    // Matches SensorNode.nodeId — not a ref to avoid join overhead
  },

  // Sensor data — matches exact MQTT JSON payload from ESP32
  waterLevel:    { type: Number, required: true }, // cm
  temperature:   { type: Number },                 // °C
  humidity:      { type: Number },                 // %
  pressure:      { type: Number },                 // hPa
  rainfall:      { type: Boolean, default: false },
  batteryVoltage:{ type: Number },                 // V
  batteryPercent:{ type: Number },                 // %
  solarVoltage:  { type: Number },                 // V

  // Communication metadata
  rssi:      { type: Number },     // signal strength dBm
  commLayer: {
    type: String,
    enum: ['4G', '2G', 'LORA', 'SD'],
    default: '4G',
  },

  // Alert level at time of reading — computed by alert engine
  alertLevel: {
    type: String,
    enum: ['SAFE', 'WATCH', 'WARNING', 'DANGER', 'CRITICAL'],
    default: 'SAFE',
    index: true,
  },

  // GPS from MQTT packet (nodes with GPS module)
  lat: { type: Number },
  lng: { type: Number },

  // Exact timestamp from ESP32 device clock
  deviceTimestamp: { type: Date },
  // Timestamp when backend received the packet
  receivedAt: {
    type:    Date,
    default: Date.now,
    index:   true,
  },

}, {
  // No timestamps: true — using receivedAt instead
  // TTL: auto-delete readings older than 90 days
});

// TTL index — readings expire after 90 days automatically
sensorReadingSchema.index(
  { receivedAt: 1 },
  { expireAfterSeconds: 90 * 24 * 60 * 60 }
);

// Compound index for dashboard time-series queries
sensorReadingSchema.index({ nodeId: 1, receivedAt: -1 });
sensorReadingSchema.index({ alertLevel: 1, receivedAt: -1 });

module.exports = mongoose.model('SensorReading', sensorReadingSchema);
