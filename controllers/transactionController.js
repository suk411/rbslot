const mongoose = require("mongoose");
const User = require("../models/User.js");
const Transaction = require("../models/Transaction.js");

// Create transaction (append-only) with atomic balance update
exports.createTransaction = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    const { amount, type, meta } = req.body;
    const actor = req.user; // from JWT

    if (!actor || !actor.userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (typeof amount !== "number" || amount <= 0) {
      return res
        .status(400)
        .json({ error: "amount must be a positive number (paisa)" });
    }
    if (!["credit", "debit"].includes(type)) {
      return res
        .status(400)
        .json({ error: "type must be 'credit' or 'debit'" });
    }

    await session.startTransaction();

    const user = await User.findOne({ userId: actor.userId }).session(session);
    if (!user) {
      await session.abortTransaction();
      return res.status(404).json({ error: "User not found" });
    }

    const delta = type === "credit" ? amount : -amount;
    if (type === "debit" && user.balance + delta < 0) {
      await session.abortTransaction();
      return res.status(400).json({ error: "Insufficient balance" });
    }

    const tx = await Transaction.create(
      [
        {
          userId: user.userId,
          amount,
          type,
          status: "pending", // start as pending
          meta,
        },
      ],
      { session }
    );
    const transaction = tx[0];

    await session.commitTransaction();
    session.endSession();

    return res.status(201).json(transaction);
  } catch (err) {
    await session.abortTransaction().catch(() => {});
    session.endSession();
    return res.status(500).json({ error: err.message });
  }
};

// Admin: update transaction status
exports.updateTransactionStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    if (!["pending", "completed", "failed"].includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    const tx = await Transaction.findOne({ orderId });
    if (!tx) return res.status(404).json({ error: "Transaction not found" });

    tx.status = status;
    await tx.save();

    return res.json(tx);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// Get all transactions for logged-in user
exports.getUserTransactions = async (req, res) => {
  try {
    const actor = req.user;
    const transactions = await Transaction.find({ userId: actor.userId }).sort({
      createdAt: -1,
    });
    return res.json(transactions);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
