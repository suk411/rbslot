const mongoose = require("mongoose");
const Counter = require("./Counter");

const transactionSchema = new mongoose.Schema(
  {
    orderId: { type: String, unique: true, index: true },
    userId: { type: String, required: true, index: true },
    amount: { type: Number, required: true },
    type: {
      type: String,
      enum: ["credit", "debit"],
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["pending", "completed", "failed"],
      default: "pending",
      index: true,
    },
    meta: { type: Object },
    seenByUser: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

// Auto-generate orderId: ORD00001, ORD00002, ...
transactionSchema.pre("save", async function () {
  if (!this.orderId) {
    const counter = await Counter.findOneAndUpdate(
      { name: "orderId" },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );
    this.orderId = `ORD${String(counter.seq).padStart(5, "0")}`;
  }
});

module.exports = mongoose.model("Transaction", transactionSchema);
