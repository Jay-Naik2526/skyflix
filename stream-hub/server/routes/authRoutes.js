const express = require("express");
const router = express.Router();
const { register, login, getMe, logout, updateHistory } = require("../controllers/authController"); // 👈 Import updateHistory
const { protect } = require("../middleware/authMiddleware");

// Public Routes (No Login Required)
router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);

// Protected Routes (Login Required)
router.get("/me", protect, getMe);
router.put("/history", protect, updateHistory);// 👈 NEW: Save Watch Progress

module.exports = router;