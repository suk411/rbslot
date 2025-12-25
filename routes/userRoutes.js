const express = require("express");
const router = express.Router();
const {
  createUser,
  getUserBalance,
} = require("../controllers/userController.js");

router.post("/create", createUser);
router.get("/balance/:userId", getUserBalance);

module.exports = router;
