const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware.js");
const {
  createUser,
  getUserBalance,
} = require("../controllers/userController.js");

router.post("/create", createUser);
router.get("/balance/:userId", getUserBalance);
router.get("/me/balance", protect, getMyBalance);
module.exports = router;
