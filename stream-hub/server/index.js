const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const cookieParser = require("cookie-parser"); // 🌟 NEW: For reading auth cookies
require("dotenv").config();

// Import Routes
const contentRoutes = require("./routes/contentRoutes");
const adminRoutes = require("./routes/adminRoutes");
const authRoutes = require("./routes/authRoutes"); // 🌟 NEW: Auth Routes
const { fetchMetadata } = require("./controllers/metadataController");
const { syncContent } = require("./controllers/syncController");

const app = express();

// Middleware
app.use(cors({
  origin: "http://localhost:5173", // Allow your Frontend
  credentials: true // 🌟 IMPORTANT: Allows cookies to be sent back and forth
}));
app.use(express.json());
app.use(cookieParser()); // 🌟 NEW: Activate cookie parser

// Database Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ MongoDB Error:", err));

// Routes
app.use("/api/content", contentRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/auth", authRoutes); // 🌟 NEW: Mount Auth Routes

// Special Routes
app.get("/api/metadata/fetch", fetchMetadata);
app.get("/api/sync", syncContent);

// Test Route
app.get("/", (req, res) => {
  res.send("StreamHub API is Running...");
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});