const mongoose = require('mongoose');

const versionSchema = new mongoose.Schema({
  versionNumber: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  projectId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Project',
    required: true 
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'deprecated'],
    default: 'draft'
  },
  downloadUrl: {
    type: String,
    trim: true
  },
  originalFileName: {
    type: String,
    trim: true
  },
  fileExt: {
    type: String,
    trim: true
  },
  fileSize: {
    type: Number
  },
  publishedBy: {
    type: String,
    trim: true
  },
  updateType: {
    type: String,
    enum: ['force', 'active', 'passive'],
    default: 'passive',
    trim: true
  },
  descriptionFileUrl: {
    type: String,
    trim: true
  },
  descriptionFileName: {
    type: String,
    trim: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Version', versionSchema);