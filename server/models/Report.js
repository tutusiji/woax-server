const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    trim: true
  },
  ip: {
    type: String,
    required: true,
    trim: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  userAgent: {
    type: String,
    trim: true
  },
  deviceInfo: {
    type: String,
    trim: true
  },
  location: {
    type: String,
    trim: true
  },
  additionalData: {
    type: mongoose.Schema.Types.Mixed
  }
}, { timestamps: true });

module.exports = mongoose.model('Report', reportSchema);