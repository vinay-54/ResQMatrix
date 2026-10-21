const mongoose = require('mongoose');

const rescueCampSchema = new mongoose.Schema({
  campId: {
    type:   String,
    unique: true,
    trim:   true,
    index:  true,
  },
  name:    { type: String, required: true, trim: true },
  address: { type: String },
  contact: { type: String },

  lat: { type: Number, required: true },
  lng: { type: Number, required: true },

  status: {
    type:    String,
    enum:    ['active', 'full', 'closed', 'preparing'],
    default: 'active',
    index:   true,
  },

  capacity:         { type: Number, default: 100 },
  currentOccupancy: { type: Number, default: 0   },

  facilities: {
    water:       { type: Boolean, default: true  },
    food:        { type: Boolean, default: true  },
    medical:     { type: Boolean, default: false },
    shelter:     { type: Boolean, default: true  },
    electricity: { type: Boolean, default: false },
  },

  deploymentArea: { type: String },
  managedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref:  'User',
  },

  isActive: { type: Boolean, default: true },

}, { timestamps: true });

rescueCampSchema.index({ lat: 1, lng: 1 });
rescueCampSchema.index({ status: 1, deploymentArea: 1 });

module.exports = mongoose.model('RescueCamp', rescueCampSchema);
