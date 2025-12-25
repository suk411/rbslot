const express = require("express");
const router = express.Router();
const {
  createTransaction,
  updateTransactionStatus,
} = require("../controllers/transactionController.js");
const { protect, adminOnly } = require("../middleware/authMiddleware.js");

// Logged-in users create transactions
router.post("/create", protect, createTransaction);

// Admin can change status
router.patch("/:orderId/status", protect, adminOnly, updateTransactionStatus);

module.exports = router;
