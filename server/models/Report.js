const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema(
  {
    username: { type: String, required: true },
    ip: String,
    timestamp: { type: Date, default: Date.now },
    version: String,
    remark: String,
    deviceInfo: String,
    // ...如有其它字段...
  },
  { collection: "statistics" }
);

module.exports = mongoose.model("Report", reportSchema);
