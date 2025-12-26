const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const cookieParser = require("cookie-parser");
require("dotenv").config();

// Import Routes
const contentRoutes = require("./routes/contentRoutes");
const adminRoutes = require("./routes/adminRoutes");
const authRoutes = require("./routes/authRoutes");
const { fetchMetadata } = require("./controllers/metadataController");
const { syncContent } = require("./controllers/syncController");

const app = express();

// 🌟 FIX: BETTER CORS FOR LOCALHOST & PRODUCTION
const allowedOrigins = [
  "http://localhost:5173",          
  "https://skyflix.qzz.io",         
  process.env.CLIENT_URL            
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, or Postman)
    if (!origin) return callback(null, true);
    
    // 🌟 OPTIMIZED CHECK: Allow any Localhost, Vercel, or Custom Domain
    if (
      allowedOrigins.includes(origin) || 
      origin.includes("localhost") ||    // ✅ Allow ANY localhost port (Fixes Cookie Issues)
      origin.endsWith(".vercel.app") ||  
      origin.endsWith(".qzz.io")         
    ) {
      callback(null, true);
    } else {
      console.log("🚫 CORS Blocked:", origin); 
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true // 🌟 CRITICAL: Allows Cookies/Login to work
}));

app.use(express.json());
app.use(cookieParser());

// Database Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ MongoDB Error:", err));

// Routes
app.use("/api/content", contentRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/auth", authRoutes);

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