const User = require("../models/User.js");
const bcrypt = require("bcryptjs");

// Create user (admin or system flow)
exports.createUser = async (req, res) => {
  try {
    const { mobileNumber, password, role } = req.body;
    if (!mobileNumber || !password) {
      return res
        .status(400)
        .json({ error: "mobileNumber and password are required" });
    }

    const existingUser = await User.findOne({ mobileNumber });
    if (existingUser)
      return res.status(400).json({ error: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      mobileNumber,
      password: hashedPassword,
      role: role || "user",
    });

    return res.status(201).json({
      userId: user.userId,
      mobileNumber: user.mobileNumber,
      role: user.role,
      balance: user.balance,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// Get balance by userId
exports.getUserBalance = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findOne({ userId });
    if (!user) return res.status(404).json({ error: "User not found" });

    return res.json({ userId: user.userId, balance: user.balance });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// Get balance for logged-in user (via JWT)
exports.getMyBalance = async (req, res) => {
  try {
    const actor = req.user; // decoded from JWT by protect middleware
    if (!actor || !actor.userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const user = await User.findOne({ userId: actor.userId });
    if (!user) return res.status(404).json({ error: "User not found" });

    return res.json({ userId: user.userId, balance: user.balance });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
