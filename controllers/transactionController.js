const mongoose = require("mongoose");
const User = require("../models/User.js");
const Transaction = require("../models/Transaction.js");

// Create transaction (append-only) with atomic balance update
exports.createTransaction = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    const { amount, type, meta } = req.body;
    const actor = req.user;

    if (!actor || !actor.userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    if (typeof amount !== "number" || amount <= 0) {
      return res.status(400).json({ error: "Amount must be positive" });
    }
    if (!["credit", "debit"].includes(type)) {
      return res
        .status(400)
        .json({ error: "Type must be 'credit' or 'debit'" });
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
      [{ userId: user.userId, amount, type, status: "pending", meta }],
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    return res.status(201).json(tx[0]);
  } catch (err) {
    await session.abortTransaction().catch(() => {});
    session.endSession();
    return res.status(500).json({ error: err.message });
  }
};

// User requests withdrawal (deduct immediately)
exports.createWithdrawal = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    const { amount, bankIndex } = req.body;
    const actor = req.user;

    if (!actor || !actor.userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    if (typeof amount !== "number" || amount <= 0) {
      return res.status(400).json({ error: "Amount must be positive" });
    }

    await session.startTransaction();

    const user = await User.findOne({ userId: actor.userId }).session(session);
    if (!user) {
      await session.abortTransaction();
      return res.status(404).json({ error: "User not found" });
    }

    if (bankIndex == null || !user.bankAccounts[bankIndex]) {
      await session.abortTransaction();
      return res.status(400).json({ error: "Invalid bank account" });
    }

    if (user.balance < amount) {
      await session.abortTransaction();
      return res.status(400).json({ error: "Insufficient balance" });
    }

    // Deduct immediately
    user.balance -= amount;
    await user.save({ session });

    const tx = await Transaction.create(
      [
        {
          userId: user.userId,
          amount,
          type: "debit",
          status: "pending",
          meta: { bankAccount: user.bankAccounts[bankIndex] },
        },
      ],
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    return res.status(201).json(tx[0]);
  } catch (err) {
    await session.abortTransaction().catch(() => {});
    session.endSession();
    return res.status(500).json({ error: err.message });
  }
};

// Admin: approve or reject transaction (refund if failed)
exports.updateTransactionStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    if (!["completed", "failed"].includes(status)) {
      return res
        .status(400)
        .json({ error: "Status must be 'completed' or 'failed'" });
    }

    const tx = await Transaction.findOne({ orderId });
    if (!tx) return res.status(404).json({ error: "Transaction not found" });
    if (tx.status !== "pending") {
      return res.status(400).json({ error: "Transaction already finalized" });
    }

    const user = await User.findOne({ userId: tx.userId });
    if (!user) return res.status(404).json({ error: "User not found" });

    if (status === "completed") {
      // ✅ Update balance for credit deposits
      if (tx.type === "credit") {
        user.balance += tx.amount;
        await user.save();
      }
      // ✅ For debit withdrawals, balance was already deducted at request time
      tx.status = "completed";
      await tx.save();
      return res.json(tx);
    }

    if (status === "failed") {
      // Refund only if debit
      if (tx.type === "debit") {
        user.balance += tx.amount;
        await user.save();
      }
      tx.status = "failed";
      await tx.save();
      return res.json(tx);
    }
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// Get paginated transactions for logged-in user
exports.getUserTransactions = async (req, res) => {
  try {
    const actor = req.user;
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;

    const transactions = await Transaction.find({ userId: actor.userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Transaction.countDocuments({ userId: actor.userId });
    const totalPages = Math.ceil(total / limit);

    return res.json({ page, totalPages, totalRecords: total, transactions });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// Get unseen completed transactions for logged-in user
exports.getUnseenCompletedTransactions = async (req, res) => {
  try {
    const actor = req.user;
    const tx = await Transaction.find({
      userId: actor.userId,
      status: "completed",
      seenByUser: false,
    }).sort({ createdAt: -1 });

    return res.json(tx);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// Mark transaction as seen
exports.markTransactionSeen = async (req, res) => {
  try {
    const { orderId } = req.params;
    const actor = req.user;

    const tx = await Transaction.findOne({ orderId, userId: actor.userId });
    if (!tx) return res.status(404).json({ error: "Transaction not found" });

    tx.seenByUser = true;
    await tx.save();

    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
