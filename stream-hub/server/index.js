const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const adminRoutes = require("./routes/adminRoutes");

// -----------------------------------------------------
// 1. IMPORT THE CONTENT ROUTES (Make sure this is here)
// -----------------------------------------------------
const contentRoutes = require("./routes/contentRoutes"); 
require("dotenv").config();

// Load Models
require("./models/Movie");
require("./models/Series");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
    origin: "*", 
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
}));
app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("🔥 MongoDB Connected Successfully"))
  .catch((err) => console.error("❌ MongoDB Connection Error:", err));

// Routes
app.use("/api/admin", adminRoutes);

// -----------------------------------------------------
// 2. REGISTER THE CONTENT ROUTE (Crucial Step!)
// -----------------------------------------------------
app.use("/api/content", contentRoutes); 

app.get("/", (req, res) => {
  res.send("JioHotstar Backend is Running!");
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});