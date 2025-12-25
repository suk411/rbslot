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

    // Validate
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

    // Find user
    const user = await User.findOne({ userId: actor.userId }).session(session);
    if (!user) {
      await session.abortTransaction();
      return res.status(404).json({ error: "User not found" });
    }

    // Determine delta for balance
    const delta = type === "credit" ? amount : -amount;

    // Prevent negative balances on debit
    if (type === "debit" && user.balance + delta < 0) {
      await session.abortTransaction();
      return res.status(400).json({ error: "Insufficient balance" });
    }

    // Append transaction
    const tx = await Transaction.create(
      [
        {
          userId: user.userId,
          amount,
          type,
          status: "completed",
          meta,
        },
      ],
      { session }
    );
    const transaction = tx[0];

    // Atomic balance update
    user.balance += delta;
    await user.save({ session });

    await session.commitTransaction();
    session.endSession();

    return res.status(201).json({
      orderId: transaction.orderId,
      userId: user.userId,
      type,
      amount,
      balance: user.balance,
      status: transaction.status,
    });
  } catch (err) {
    await session.abortTransaction().catch(() => {});
    session.endSession();
    return res.status(500).json({ error: err.message });
  }
};

// Admin: update transaction status (append-only audit, does not alter amount)
exports.updateTransactionStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    if (!["pending", "completed", "failed"].includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    const tx = await Transaction.findOne({ orderId });
    if (!tx) return res.status(404).json({ error: "Transaction not found" });

    // Only update status; amount/history remain immutable
    tx.status = status;
    await tx.save();

    return res.json({
      orderId: tx.orderId,
      userId: tx.userId,
      type: tx.type,
      amount: tx.amount,
      status: tx.status,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
