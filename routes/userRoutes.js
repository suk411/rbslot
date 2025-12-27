const express = require("express");
const router = express.Router();
const {
  createUser,
  getUserBalance,
  getMyBalance,
  addBankAccount,
  getMyBankAccounts,
} = require("../controllers/userController.js");
const { protect } = require("../middleware/authMiddleware.js");

router.post("/create", createUser);
router.get("/balance/:userId", getUserBalance);
router.get("/me/balance", protect, getMyBalance);
router.post("/me/bank", protect, addBankAccount); 
router.get("/me/bank", protect, getMyBankAccounts);
module.exports = router;
