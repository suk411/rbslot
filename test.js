const crypto = require("crypto");

const signStr =
  "amount=500&appId=c8da3307f66655642e2f6e7beaf970d5&currency=INR&extra=email=test@1234.com&mobile=911111111112&name=test&merOrderNo=ORDER50001&notifyUrl=https://www.example.com/notify&returnUrl=https://www.example.com/return&key=cb787c3acbaf951bdc5dcbe308b241a1";

const sign = crypto.createHash("sha256").update(signStr, "utf8").digest("hex");

console.log("Signature:", sign);
