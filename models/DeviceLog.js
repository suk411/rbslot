const mongoose = require("mongoose");

const deviceLogSchema = new mongoose.Schema(
  {
    userId: { type: String, index: true },
    deviceId: { type: String, index: true },
    ip: { type: String, index: true },
    adId: { type: String, index: true }, // optional advertisement ID
    ua: { type: String }, // user agent
    createdAt: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

module.exports = mongoose.model("DeviceLog", deviceLogSchema);
