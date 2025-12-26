const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });
};

// @desc    Register new user
// @route   POST /api/auth/register
const register = async (req, res) => {
  try {
    const { username, email, password, avatar } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: "Please add all fields" });
    }

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = await User.create({
      username,
      email,
      password: hashedPassword,
      avatar: avatar || "https://upload.wikimedia.org/wikipedia/commons/0/0b/Netflix-avatar.png"
    });

    if (user) {
      // Send HTTP-Only Cookie (Secure)
      const token = generateToken(user._id);
      res.cookie('token', token, {
        httpOnly: true, // Prevents XSS attacks
        secure: process.env.NODE_ENV === 'production', // HTTPS only in prod
        maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
      });

      res.status(201).json({
        _id: user.id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        role: "user" // Hardcoded for now
      });
    } else {
      res.status(400).json({ message: "Invalid user data" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};

// @desc    Authenticate a user
// @route   POST /api/auth/login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (user && (await bcrypt.compare(password, user.password))) {
      // Send HTTP-Only Cookie
      const token = generateToken(user._id);
      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 30 * 24 * 60 * 60 * 1000
      });

      res.json({
        _id: user.id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        watchHistory: user.watchHistory, // Send history on login
        myList: user.myList
      });
    } else {
      res.status(400).json({ message: "Invalid credentials" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};

// @desc    Get user data (Persist Login)
// @route   GET /api/auth/me
const getMe = async (req, res) => {
  try {
    // We will decode the cookie in the middleware later
    const user = await User.findById(req.user.id).select("-password"); // Exclude password
    res.json(user);
  } catch (error) {
    res.status(401).json({ message: "Not authorized" });
  }
};

// @desc    Logout user
// @route   POST /api/auth/logout
const logout = async (req, res) => {
  res.cookie('token', '', {
    httpOnly: true,
    expires: new Date(0) // Expire immediately
  });
  res.status(200).json({ message: "Logged out" });
};

module.exports = { register, login, getMe, logout };