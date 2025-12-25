const mongoose = require("mongoose");
const Counter = require("./Counter");

const userSchema = new mongoose.Schema({
  userId: { type: String, unique: true, index: true },
  mobileNumber: { type: String, unique: true, index: true, required: true },
  password: { type: String, required: true, select: false },
  role: { type: String, enum: ["user", "admin"], default: "user", index: true },
  balance: { type: Number, default: 0, required: true }, // stored in paisa
  createdAt: { type: Date, default: Date.now },
});

// Auto-generate userId: BB00001, BB00002, ...
userSchema.pre("save", async function () {
  if (!this.userId) {
    const counter = await Counter.findOneAndUpdate(
      { name: "userId" },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );
    this.userId = `BB${String(counter.seq).padStart(5, "0")}`;
  }
});

module.exports = mongoose.model("User", userSchema);
