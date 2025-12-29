// services/paysimply.js
require("dotenv").config();
const crypto = require("crypto");
const axios = require("axios");

const APP_ID = process.env.PAYSIMPLY_APP_ID;
const SECRET = process.env.PAYSIMPLY_SECRET;
const BASE_URL = process.env.PAYSIMPLY_BASE_URL;

function generateSign(params, secret) {
  const parseExtra = (extra) => {
    const keys = Object.keys(extra).sort();
    return keys.map((k) => `${k}=${extra[k]}`).join("&");
  };

  const keys = Object.keys(params)
    .filter((k) => k !== "sign")
    .sort();
  let signStr = keys
    .map((k) => {
      if (typeof params[k] === "object" && params[k] !== null) {
        return `${k}=${parseExtra(params[k])}`;
      }
      return `${k}=${params[k]}`;
    })
    .join("&");

  signStr += `&key=${secret}`;
  return crypto.createHash("sha256").update(signStr, "utf8").digest("hex");
}

async function createPaymentOrder({ merOrderNo, amount, user }) {
  const params = {
    appId: APP_ID,
    merOrderNo,
    currency: "INR",
    amount: String(amount),
    returnUrl: process.env.PAYSIMPLY_RETURN_URL,
    notifyUrl: process.env.PAYSIMPLY_NOTIFY_URL,
    extra: {
      name: user?.name || user?.userId || "user",
      email: user?.email || `${user?.userId || "user"}@example.com`,
      mobile: user?.mobileNumber || "911111111112",
    },
  };

  params.sign = generateSign(params, SECRET);

  const res = await axios.post(BASE_URL, params, {
    headers: { "Content-Type": "application/json" },
    timeout: 15000,
  });

  return res.data;
}

module.exports = { createPaymentOrder };
