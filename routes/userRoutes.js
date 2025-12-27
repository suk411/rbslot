const express = require("express");
const router = express.Router();
const {
  createUser,
  getUserBalance,
  getMyBalance,
} = require("../controllers/userController.js");
const { protect } = require("../middleware/authMiddleware.js");

router.post("/create", createUser);
router.get("/balance/:userId", getUserBalance); // existing
router.get("/me/balance", protect, getMyBalance); // ✅ new secure endpoint

module.exports = router;
