require("dotenv").config();
const express = require("express");
const cors = require("cors"); // ✅ add cors
const connectDB = require("./config/db.js");

const authRoutes = require("./routes/authRoutes.js");
const userRoutes = require("./routes/userRoutes.js");
const transactionRoutes = require("./routes/transactionRoutes.js");
const deviceRoutes = require("./routes/deviceRoutes.js");
const adminRoutes = require("./routes/adminRoutes.js");
const app = express();
connectDB();

// ✅ Allow all origins
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/devices", deviceRoutes);
app.use("/api/admin", adminRoutes);
// 404 fallback
app.use((req, res) => {
  res.status(404).json({ error: `Cannot ${req.method} ${req.originalUrl}` });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT} 🚀`));
