const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
    required: true
  },
  email: {
    type: String,
    trim: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  ip: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['pending', 'reviewed', 'resolved'],
    default: 'pending'
  },
  response: {
    type: String,
    default: ''
  }
}, { timestamps: true });

module.exports = mongoose.model('Feedback', feedbackSchema);