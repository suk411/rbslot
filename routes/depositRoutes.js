const express = require("express");
const router = express.Router();
const { protect, adminOnly } = require("../middleware/authMiddleware.js");

const {
  createDepositRequest,
  submitUTR,
  adminFindDeposits,
  adminUpdateStatus,
  getUserDeposits,
} = require("../controllers/depositController.js");

// User routes
router.post("/request", protect, createDepositRequest);
router.post("/utr", protect, submitUTR);
router.get("/my", protect, getUserDeposits);

// Admin routes
router.get("/admin/find", protect, adminOnly, adminFindDeposits);
router.patch("/admin/:order_id/status", protect, adminOnly, adminUpdateStatus);

module.exports = router;
