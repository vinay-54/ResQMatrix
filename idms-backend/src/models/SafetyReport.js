const mongoose = require('mongoose');

// Citizen safety check-ins from User Portal I'm Safe feature
const safetyReportSchema = new mongoose.Schema({
  reportRef: {
    type:   String,
    unique: true,
    index:  true,
    // e.g. "STATUS-1729123456789"
  },

  userId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  userName:  { type: String },
  userEmail: { type: String },
  userPhone: { type: String },

  status: {
    type:     String,
    enum:     ['safe', 'help', 'sos'],
    required: true,
    index:    true,
  },

  // Family members included in this report
  familyMembers: [{
    name: { type: String },
    phone: { type: String },
    status: {
      type: String,
      enum: ['safe', 'unknown', 'help'],
      default: 'unknown',
    },
  }],

  // Location at time of report
  location: {
    lat:      { type: Number },
    lng:      { type: Number },
    accuracy: { type: Number },
  },

  // If status === 'sos' — links to an alert/incident
  linkedAlert:    { type: mongoose.Schema.Types.ObjectId, ref: 'Alert'       },
  linkedIncident: { type: mongoose.Schema.Types.ObjectId, ref: 'SOSIncident' },

  notes:     { type: String },
  timestamp: { type: Date, default: Date.now, index: true },

}, { timestamps: true });

safetyReportSchema.index({ status: 1, timestamp: -1 });

module.exports = mongoose.model('SafetyReport', safetyReportSchema);
