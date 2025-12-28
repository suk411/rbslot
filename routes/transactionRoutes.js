const express = require("express");
const router = express.Router(); // <-- you forgot this line
const { protect, adminOnly } = require("../middleware/authMiddleware.js");
const {
  createTransaction,
  createWithdrawal,
  updateTransactionStatus,
  getUserTransactions,

  getUnseenCompletedTransactions,
  markTransactionSeen,
} = require("../controllers/transactionController.js");
// Logged-in users create transactions
router.post("/create", protect, createTransaction);
// Logged-in users create withdrawal requests
router.post("/withdraw", protect, createWithdrawal);

// Logged-in users can view their own transactions
router.get("/my", protect, getUserTransactions);
// Get unseen completed transactions for user
router.get("/unseen/completed", protect, getUnseenCompletedTransactions); 
router.patch("/:orderId/seen", protect, markTransactionSeen);

// Admin can change status
router.patch("/:orderId/status", protect, adminOnly, updateTransactionStatus);

module.exports = router;
