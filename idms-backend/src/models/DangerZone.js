const mongoose = require('mongoose');

const dangerZoneSchema = new mongoose.Schema({
  zoneId: {
    type:   String,
    unique: true,
    trim:   true,
  },
  name:   { type: String, required: true },
  reason: { type: String },

  lat:    { type: Number, required: true },
  lng:    { type: Number, required: true },
  radius: { type: Number, default: 80 }, // metres

  level: {
    type:    String,
    enum:    ['WATCH', 'WARNING', 'DANGER', 'CRITICAL'],
    default: 'WARNING',
    index:   true,
  },

  // Source — auto-generated from sensor or manually added
  source: {
    type: String,
    enum: ['AUTO', 'MANUAL'],
    default: 'MANUAL',
  },
  linkedNode: { type: String }, // nodeId if AUTO

  isActive:  { type: Boolean, default: true, index: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  expiresAt: { type: Date }, // auto-clear after flood recedes

}, { timestamps: true });

module.exports = mongoose.model('DangerZone', dangerZoneSchema);
