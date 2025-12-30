const mongoose = require("mongoose");
const Counter = require("./Counter");

const depositOrderSchema = new mongoose.Schema(
  {
    order_id: { type: String, unique: true, index: true },
    user_id: { type: String, required: true, index: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: "INR" },
    status: {
      type: String,
      enum: ["PENDING", "SUCCESS", "FAILED", "EXPIRED"],
      default: "PENDING",
      index: true,
    },
    gateway_order_no: { type: String },
    payment_links: { type: Object, default: {} },
    expiry_seconds: { type: Number, default: 600 },

    // ✅ system-set channel name
    channel_name: { type: String, default: "Paysimply" },

    note: { type: String },
  },
  {
    versionKey: false,
    timestamps: true, // ✅ adds createdAt and updatedAt automatically
  }
);

depositOrderSchema.pre("save", async function () {
  if (!this.order_id) {
    const counter = await Counter.findOneAndUpdate(
      { name: "depositOrderId" },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );
    const seqStr = String(counter.seq).padStart(12, "0");
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    this.order_id = `DP${yyyy}${mm}${dd}${seqStr}`;
  }
});

module.exports = mongoose.model("DepositOrder", depositOrderSchema);
