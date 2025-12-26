const User = require("../models/User.js");
const Transaction = require("../models/Transaction.js");
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
