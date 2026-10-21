const mongoose = require('mongoose');

// FWPU-X unit status and readings
const purificationSchema = new mongoose.Schema({
  unitId: {
    type:     String,
    required: true,
    unique:   true,
    index:    true,
    // e.g. "FWPU-01"
  },
  name: { type: String, default: 'FWPU-X Unit 1' },
  status: {
    type:    String,
    enum:    ['operational', 'standby', 'maintenance', 'offline'],
    default: 'offline',
    index:   true,
  },

  // GPS
  lat: { type: Number },
  lng: { type: Number },

  // Latest sensor readings — denormalized for dashboard
  current: {
    tdsInput:     { type: Number }, // ppm raw water
    tdsOutput:    { type: Number }, // ppm clean water
    turbidityIn:  { type: Number }, // NTU
    turbidityOut: { type: Number }, // NTU
    ph:           { type: Number },
    temperature:  { type: Number }, // °C
    flowRateIn:   { type: Number }, // L/min
    flowRateOut:  { type: Number }, // L/min
    batteryPct:   { type: Number }, // %
    solarVoltage: { type: Number }, // V
    // Actuator states
    roPumpOn:     { type: Boolean, default: false },
    uvOn:         { type: Boolean, default: false },
    motorLeft:    { type: Number, default: 0 },  // PWM 0–100
    motorRight:   { type: Number, default: 0 },
    mode: {
      type:    String,
      enum:    ['PURIFYING', 'IDLE', 'MOVING', 'STOPPED'],
      default: 'IDLE',
    },
    receivedAt: { type: Date },
  },

  // Daily production stats
  daily: {
    volumeProduced: { type: Number, default: 0 }, // litres
    avgTDSOutput:   { type: Number },
    avgFlowRate:    { type: Number },
    operatingHours: { type: Number, default: 0 },
    date:           { type: Date },
  },

  // Specs
  specs: {
    capacity:   { type: String, default: '40–60 L/day' },
    power:      { type: String, default: '250W Solar + LiFePO4 50Ah' },
    stages:     { type: Number, default: 5  },
    roCapacity: { type: String, default: '50 GPD' },
    uvPower:    { type: String, default: '11W' },
  },

  communicationLayer: {
    type:    String,
    enum:    ['4G', 'LORA', 'SD'],
    default: '4G',
  },

  isActive: { type: Boolean, default: true },

}, { timestamps: true });

module.exports = mongoose.model('Purification', purificationSchema);
