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
// ✅ NEW: Get balance for logged-in user (via JWT)
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
// Add a new bank account for logged-in user
exports.addBankAccount = async (req, res) => {
  try {
    const actor = req.user;
    const { holderName, accountNumber, ifsc, bankName } = req.body;

    if (!actor || !actor.userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!holderName || !accountNumber || !ifsc || !bankName) {
      return res.status(400).json({ error: "All fields are required" });
    }
    if (ifsc.length !== 11) {
      return res
        .status(400)
        .json({ error: "IFSC must be exactly 11 characters long" });
    }

    const user = await User.findOne({ userId: actor.userId });
    if (!user) return res.status(404).json({ error: "User not found" });

    user.bankAccounts.push({ holderName, accountNumber, ifsc, bankName });
    await user.save();

    return res.status(201).json(user.bankAccounts);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// Get all bank accounts for logged-in user
exports.getMyBankAccounts = async (req, res) => {
  try {
    const actor = req.user;
    if (!actor || !actor.userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const user = await User.findOne({ userId: actor.userId });
    if (!user) return res.status(404).json({ error: "User not found" });

    return res.json(user.bankAccounts);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
