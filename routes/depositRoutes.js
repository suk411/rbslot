// routes/depositRoutes.js
const express = require("express");
const router = express.Router();
const { protect, adminOnly } = require("../middleware/authMiddleware.js");

const {
  createDepositRequest,
  adminFindDeposits,
  adminUpdateStatus,
  getUserDeposits,
} = require("../controllers/depositController.js");

// =======================
// User routes
// =======================

// User creates a deposit request
router.post("/request", protect, createDepositRequest);

// User fetches their own deposits (10 per page)
router.get("/my", protect, getUserDeposits);
router.get("/admin/find", protect, adminOnly, adminFindDeposits);

// Admin updates deposit status (SUCCESS / FAILED / EXPIRED)
router.patch("/admin/:order_id/status", protect, adminOnly, adminUpdateStatus);

module.exports = router;
