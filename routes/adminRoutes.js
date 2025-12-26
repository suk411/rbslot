const express = require("express");
const router = express.Router();
const { protect, adminOnly } = require("../middleware/authMiddleware.js");
const {
  listUsers,
  listTransactions,
  getStats,
  listDevices,
  findLinkedAccounts,
} = require("../controllers/adminController.js");

router.get("/users", protect, adminOnly, listUsers);
router.get("/transactions", protect, adminOnly, listTransactions);
router.get("/stats", protect, adminOnly, getStats);
router.get("/devices", protect, adminOnly, listDevices);
router.get("/users/:userId/linked", protect, adminOnly, findLinkedAccounts);
module.exports = router;
