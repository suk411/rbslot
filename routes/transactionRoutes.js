const express = require("express");
const router = express.Router(); // <-- you forgot this line
const { protect, adminOnly } = require("../middleware/authMiddleware.js");
const {
  createTransaction,
  createWithdrawal,
  updateTransactionStatus,
  getUserTransactions,
} = require("../controllers/transactionController.js");
// Logged-in users create transactions
router.post("/create", protect, createTransaction);
// Logged-in users create withdrawal requests
router.post("/withdraw", protect, createWithdrawal);

// Logged-in users can view their own transactions
router.get("/my", protect, getUserTransactions);

// Admin can change status
router.patch("/:orderId/status", protect, adminOnly, updateTransactionStatus);

module.exports = router;
