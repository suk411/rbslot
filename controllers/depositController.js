// controllers/depositController.js
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
      return res
        .status(502)
        .json({
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

// User submits UTR
exports.submitUTR = async (req, res) => {
  try {
    const actor = req.user;
    const { order_id, utr } = req.body;

    if (!actor || !actor.userId)
      return res.status(401).json({ error: "Unauthorized" });
    if (!order_id || !utr)
      return res.status(400).json({ error: "order_id and utr are required" });
    if (!/^\d{12}$/.test(utr))
      return res.status(400).json({ error: "UTR must be 12 digits" });

    const order = await DepositOrder.findOne({
      order_id,
      user_id: actor.userId,
    });
    if (!order) return res.status(404).json({ error: "Order not found" });
    if (order.status !== "PENDING")
      return res.status(400).json({ error: "Order is not pending" });

    order.utr = utr;
    order.updated_at = new Date();
    await order.save();

    return res.json({ success: true, order_id: order.order_id });
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
        utr: order.utr || null,
        created_at: order.created_at,
        gateway_order_no: order.gateway_order_no || null,
      });
    }

    if (user_id) {
      const page = parseInt(req.query.page || "1", 10);
      const limit = 25;
      const skip = (page - 1) * limit;

      const items = await DepositOrder.find({ user_id })
        .sort({ created_at: -1 })
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
          utr: d.utr || null,
          created_at: d.created_at,
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
    if (!order)
      return res.status(404).json({ error: "Deposit order not found" });

    order.status = status;
    if (note) order.note = note;
    order.updated_at = new Date();
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
