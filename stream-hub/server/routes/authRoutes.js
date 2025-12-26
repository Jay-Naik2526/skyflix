const express = require("express");
const router = express.Router();
const { register, login, getMe, logout } = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");

// Public Routes (No Login Required)
router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);

// Protected Routes (Login Required)
// 'protect' checks the cookie before letting them see their profile
router.get("/me", protect, getMe);

module.exports = router;