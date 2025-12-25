const express = require("express");
const router = express.Router();
const { logDevice } = require("../controllers/deviceController.js");

router.post("/log", logDevice);

module.exports = router;
