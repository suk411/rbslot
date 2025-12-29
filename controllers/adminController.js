const User = require("../models/User.js");

const DeviceLog = require("../models/DeviceLog.js");

// List all users (paginated)
exports.listUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;

    const users = await User.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments();
    const totalPages = Math.ceil(total / limit);

    res.json({ page, totalPages, totalRecords: total, users });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// List all transactions (paginated)
exports.listTransactions = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;

    const transactions = await Transaction.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Transaction.countDocuments();
    const totalPages = Math.ceil(total / limit);

    res.json({ page, totalPages, totalRecords: total, transactions });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Dashboard stats
exports.getStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalTransactions = await Transaction.countDocuments();
    const totalBalanceAgg = await User.aggregate([
      { $group: { _id: null, totalBalance: { $sum: "$balance" } } },
    ]);
    const totalBalance = totalBalanceAgg[0]?.totalBalance || 0;

    res.json({ totalUsers, totalTransactions, totalBalance });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// List device logs (paginated)
exports.listDevices = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;

    const devices = await DeviceLog.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await DeviceLog.countDocuments();
    const totalPages = Math.ceil(total / limit);

    res.json({ page, totalPages, totalRecords: total, devices });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Find linked accounts by device logs
exports.findLinkedAccounts = async (req, res) => {
  try {
    const { userId } = req.params;

    // Get all device logs for this user
    const userDevices = await DeviceLog.find({ userId });

    if (!userDevices.length) {
      return res.json({ userId, linkedAccounts: [] });
    }

    // Collect identifiers used by this user
    const deviceIds = userDevices.map((d) => d.deviceId).filter(Boolean);
    const ips = userDevices.map((d) => d.ip).filter(Boolean);
    const adIds = userDevices.map((d) => d.adId).filter(Boolean);

    // Find other users who share any of these identifiers
    const linkedLogs = await DeviceLog.find({
      $or: [
        { deviceId: { $in: deviceIds } },
        { ip: { $in: ips } },
        { adId: { $in: adIds } },
      ],
      userId: { $ne: userId }, // exclude the original user
    });

    // Get distinct userIds
    const linkedUserIds = [...new Set(linkedLogs.map((d) => d.userId))];

    // Fetch user details
    const linkedUsers = await User.find({ userId: { $in: linkedUserIds } });

    res.json({ userId, linkedAccounts: linkedUsers });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
