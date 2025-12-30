const DepositOrder = require("../models/DepositOrder");
const { createPaymentOrder } = require("../services/paysimply");
const User = require("../models/User");

// User creates deposit request
exports.createDepositRequest = async (req, res) => {
  try {
    const actor = req.user;
    const { amount } = req.body;

    if (!actor || !actor.userId)
      return res.status(401).json({ error: "Unauthorized" });
    if (typeof amount !== "number" || amount <= 0)
      return res.status(400).json({ error: "Amount must be positive" });

    const user = await User.findOne({ userId: actor.userId });
    if (!user) return res.status(404).json({ error: "User not found" });

    const order = new DepositOrder({
      user_id: user.userId,
      amount,
      currency: "INR",
      status: "PENDING",
      expiry_seconds: 600,
      channel_name: "Paysimply", // ✅ system sets channel name
    });
    await order.save();

    const gateway = await createPaymentOrder({
      merOrderNo: order.order_id,
      amount,
      user: {
        userId: user.userId,
        email: `${user.userId}@example.com`,
        mobileNumber: user.mobileNumber,
        name: user.userId,
      },
    });

    if (gateway.code !== 0) {
      order.status = "FAILED";
      order.note = gateway.msg || "Gateway error";
      await order.save();
      return res.status(502).json({
        error: gateway.msg || "Payment gateway error",
        code: gateway.code,
      });
    }

    order.gateway_order_no = gateway.data?.orderNo || null;
    order.payment_links = gateway.data?.params || {};
    await order.save();

    return res.json({
      order: {
        order_id: order.order_id,
        amount: order.amount,
        expiry_seconds: order.expiry_seconds,
      },
      payment_links: order.payment_links,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// Admin: find deposits by user_id (paginated 25) or order_id (single)
exports.adminFindDeposits = async (req, res) => {
  try {
    const { user_id, order_id } = req.query;

    if (!user_id && !order_id) {
      return res
        .status(400)
        .json({ error: "Provide either user_id or order_id" });
    }

    if (order_id) {
      const order = await DepositOrder.findOne({ order_id });
      if (!order) return res.status(404).json({ error: "Order not found" });

      return res.json({
        order_id: order.order_id,
        user_id: order.user_id,
        amount: order.amount,
        currency: order.currency,
        status: order.status,
        channel_name: order.channel_name || null,
        createdAt: order.createdAt,
        gateway_order_no: order.gateway_order_no || null,
      });
    }

    if (user_id) {
      const page = parseInt(req.query.page || "1", 10);
      const limit = 25;
      const skip = (page - 1) * limit;

      const items = await DepositOrder.find({ user_id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const total = await DepositOrder.countDocuments({ user_id });

      return res.json({
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        deposits: items.map((d) => ({
          order_id: d.order_id,
          user_id: d.user_id,
          amount: d.amount,
          currency: d.currency,
          status: d.status,
          channel_name: d.channel_name || null,
          createdAt: d.createdAt,
          gateway_order_no: d.gateway_order_no || null,
        })),
      });
    }
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// Admin: update deposit status
exports.adminUpdateStatus = async (req, res) => {
  try {
    const { order_id } = req.params;
    const { status, note } = req.body;

    if (!["SUCCESS", "FAILED", "EXPIRED"].includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    const order = await DepositOrder.findOne({ order_id });
    if (!order) {
      return res.status(404).json({ error: "Deposit order not found" });
    }

    // ✅ If deposit succeeds, credit user balance
    if (status === "SUCCESS") {
      const user = await User.findOne({ userId: order.user_id });
      if (user) {
        user.balance += order.amount * 100; // rupees → paisa
        await user.save();
      }
    }

    order.status = status;
    if (note) order.note = note;
    await order.save();

    return res.json({
      success: true,
      order_id: order.order_id,
      status: order.status,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// User: get own deposits (paginated 10 per page)
exports.getUserDeposits = async (req, res) => {
  try {
    const actor = req.user;
    if (!actor || !actor.userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const page = parseInt(req.query.page || "1", 10);
    const limit = 10;
    const skip = (page - 1) * limit;

    const items = await DepositOrder.find({ user_id: actor.userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await DepositOrder.countDocuments({ user_id: actor.userId });

    return res.json({
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      deposits: items.map((d) => ({
        order_id: d.order_id,
        amount: d.amount,
        currency: d.currency,
        status: d.status,
        channel_name: d.channel_name || null,
        createdAt: d.createdAt,
      })),
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
