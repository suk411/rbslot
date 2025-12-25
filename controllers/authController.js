const User = require("../models/User.js");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// Register
exports.register = async (req, res) => {
  try {
    const { mobileNumber, password, role } = req.body;

    if (!mobileNumber || !password) {
      return res
        .status(400)
        .json({ error: "mobileNumber and password are required" });
    }

    const exists = await User.findOne({ mobileNumber });
    if (exists) return res.status(400).json({ error: "User already exists" });

    const hashed = await bcrypt.hash(password, 10);

    const user = await User.create({
      mobileNumber,
      password: hashed,
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

// Login
exports.login = async (req, res) => {
  try {
    const { mobileNumber, password } = req.body;

    if (!mobileNumber || !password) {
      return res
        .status(400)
        .json({ error: "mobileNumber and password are required" });
    }

    const user = await User.findOne({ mobileNumber }).select("+password");
    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ error: "Invalid credentials" });

    const token = jwt.sign(
      { id: user._id, userId: user.userId, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    return res.json({ token, userId: user.userId, role: user.role });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
