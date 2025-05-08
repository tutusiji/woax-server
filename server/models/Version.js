const mongoose = require('mongoose');

const versionSchema = new mongoose.Schema({
  versionNumber: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  downloadLink: {
    type: String,
    required: true,
    trim: true
  },
  releaseDate: {
    type: Date,
    default: Date.now
  },
  description: {
    type: String,
    default: ''
  },
  isActive: {
    type: Boolean,
    default: true
  },
  fileName: {
    type: String,
    trim: true
  },
  fileSize: {
    type: Number
  },
  publishedBy: {
    type: String,
    trim: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Version', versionSchema);