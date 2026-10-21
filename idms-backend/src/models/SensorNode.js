const mongoose = require('mongoose');

const sensorNodeSchema = new mongoose.Schema({
  // Identity
  nodeId: {
    type:     String,
    required: true,
    unique:   true,
    trim:     true,
    index:    true,
    // e.g. "DSN-001" — matches ESP32 device_id in MQTT payload
  },
  name: {
    type:     String,
    required: true,
    trim:     true,
  },
  location: {
    type: String,
    trim: true,
    // Human-readable — "East Bridge, Tirupati"
  },

  // GPS coordinates
  lat: { type: Number, required: true },
  lng: { type: Number, required: true },

  // Deployment
  deploymentArea: {
    type:    String,
    default: 'SVCE Campus',
  },
  installedAt:  { type: Date, default: Date.now },
  installedBy:  { type: String }, // admin user name

  // Current status — updated by MQTT on every packet
  status: {
    type:    String,
    enum:    ['online', 'offline', 'maintenance', 'low-battery'],
    default: 'offline',
    index:   true,
  },
  alertLevel: {
    type:    String,
    enum:    ['SAFE', 'WATCH', 'WARNING', 'DANGER', 'CRITICAL'],
    default: 'SAFE',
    index:   true,
  },

  // Latest reading snapshot — denormalized for fast dashboard queries
  // Full history is in SensorReading collection
  latest: {
    waterLevel:  { type: Number }, // cm from sensor to water surface
    temperature: { type: Number }, // °C
    humidity:    { type: Number }, // %
    pressure:    { type: Number }, // hPa
    rainfall:    { type: Boolean, default: false },
    battery:     { type: Number }, // %
    solarVoltage:{ type: Number }, // V
    rssi:        { type: Number }, // dBm
    commLayer: {
      type: String,
      enum: ['4G', '2G', 'LORA', 'SD'],
      default: '4G',
    },
    receivedAt:  { type: Date },
  },

  // Hardware config
  hardware: {
    controller:    { type: String, default: 'ESP32-WROOM-32' },
    waterSensor:   { type: String, default: 'JSN-SR04T' },
    commPrimary:   { type: String, default: 'SIM7600G-H' },
    commFallback1: { type: String, default: 'SIM800L' },
    commFallback2: { type: String, default: 'SX1278 LoRa' },
    enclosure:     { type: String, default: 'IP65' },
  },

  // Alert thresholds — configurable per node
  thresholds: {
    safe:     { type: Number, default: 80 },
    watch:    { type: Number, default: 40 },
    warning:  { type: Number, default: 25 },
    danger:   { type: Number, default: 15 },
    critical: { type: Number, default: 8  },
  },

  lastSeen:  { type: Date, index: true },
  isActive:  { type: Boolean, default: true },

}, { timestamps: true });

// Index for geospatial area queries
sensorNodeSchema.index({ lat: 1, lng: 1 });
sensorNodeSchema.index({ deploymentArea: 1, alertLevel: 1 });

// Virtual: is the node currently in danger state
sensorNodeSchema.virtual('isInDanger').get(function () {
  return ['DANGER', 'CRITICAL'].includes(this.alertLevel);
});

module.exports = mongoose.model('SensorNode', sensorNodeSchema);
