const mongoose = require("mongoose");

const feedbackSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      trim: true,
    },
    content: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      trim: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    ip: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ["pending", "reviewed", "resolved"],
      default: "pending",
    },
    replyInput: {
      type: String,
      default: "",
    },
    replyHistory: [
      {
        content: { type: String, required: true },
        time: { type: Date, default: Date.now },
        admin: { type: String, default: "管理员" },
      },
    ],
    projectId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Project',
      required: true 
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Feedback", feedbackSchema);
