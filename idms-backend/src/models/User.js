const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  uid: {
    type:     String,
    required: true,
    unique:   true,
    index:    true,
    // Firebase UID — links this record to Firebase Auth
  },
  email: {
    type:      String,
    required:  true,
    unique:    true,
    lowercase: true,
    trim:      true,
    index:     true,
  },
  name: {
    type:     String,
    required: true,
    trim:     true,
  },
  role: {
    type:    String,
    enum:    ['admin', 'coordinator', 'operator', 'field', 'citizen'],
    default: 'citizen',
    index:   true,
  },
  phone: {
    type: String,
    trim: true,
  },
  homeAddress: {
    type: String,
    trim: true,
  },
  familyCount: {
    type:    Number,
    default: 1,
    min:     1,
    max:     20,
  },
  notifyAlerts: {
    type:    Boolean,
    default: true,
  },
  notifySMS: {
    type:    Boolean,
    default: false,
  },
  language: {
    type:    String,
    enum:    ['en', 'te', 'hi', 'ta', 'ml'],
    default: 'en',
  },
  fcmToken: {
    // Firebase Cloud Messaging token for push notifications
    type: String,
  },
  isActive: {
    type:    Boolean,
    default: true,
  },
  lastLogin: {
    type: Date,
  },
}, {
  timestamps: true, // adds createdAt and updatedAt automatically
});

// Virtual: is this user an admin-level role?
userSchema.virtual('isAdminRole').get(function () {
  return ['admin', 'coordinator', 'operator', 'field'].includes(this.role);
});

// Virtual: is this user a citizen?
userSchema.virtual('isCitizen').get(function () {
  return this.role === 'citizen';
});

// Remove sensitive fields when converting to JSON
userSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    delete ret.__v;
    delete ret.fcmToken; // Never expose FCM token to frontend
    return ret;
  },
});

module.exports = mongoose.model('User', userSchema);
