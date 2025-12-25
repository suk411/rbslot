const DeviceLog = require("../models/DeviceLog.js");

// Log device footprint (userId optional)
exports.logDevice = async (req, res) => {
  try {
    const { userId, deviceId, ip, adId, ua } = req.body;

    const doc = await DeviceLog.create({
      userId,
      deviceId,
      ip,
      adId,
      ua,
    });

    return res.status(201).json({
      id: doc._id,
      userId: doc.userId,
      deviceId: doc.deviceId,
      ip: doc.ip,
      adId: doc.adId,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
