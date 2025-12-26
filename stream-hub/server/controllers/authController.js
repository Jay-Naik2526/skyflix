const User = require("../models/User");
const Movie = require("../models/Movie");
const Series = require("../models/Series");
const mongoose = require("mongoose"); // ✅ Needed for ObjectId casting
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "30d" });
};

// @desc    Register new user
const register = async (req, res) => {
  try {
    const { username, email, password, avatar } = req.body;
    if (!username || !email || !password) return res.status(400).json({ message: "Please add all fields" });

    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: "User already exists" });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      username,
      email,
      password: hashedPassword,
      avatar: avatar || "https://upload.wikimedia.org/wikipedia/commons/0/0b/Netflix-avatar.png"
    });

    if (user) {
      const token = generateToken(user._id);
      res.cookie('token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', maxAge: 30 * 24 * 60 * 60 * 1000 });
      res.status(201).json({ _id: user.id, username: user.username, email: user.email, avatar: user.avatar, role: "user" });
    } else {
      res.status(400).json({ message: "Invalid user data" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};

// @desc    Login user
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (user && (await bcrypt.compare(password, user.password))) {
      const token = generateToken(user._id);
      res.cookie('token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', maxAge: 30 * 24 * 60 * 60 * 1000 });
      res.json({ _id: user.id, username: user.username, email: user.email, avatar: user.avatar });
    } else {
      res.status(400).json({ message: "Invalid credentials" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};

// @desc    Get user data & history (✅ FIXED FILTERING)
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select("-password")
      .populate({
        path: "watchHistory.contentId",
        select: "title name poster_path backdrop_path overview release_date first_air_date vote_average"
      });

    if (!user) return res.status(404).json({ message: "User not found" });

    // 🌟 MAGIC FIX: Strictly remove any item where population failed.
    // If 'contentId' doesn't have a 'title' or 'name', it means it's just a raw ID string (corrupted).
    // We filter those out so the frontend doesn't crash or show empty rows.
    user.watchHistory = user.watchHistory.filter(item => 
        item.contentId && (item.contentId.title || item.contentId.name)
    );

    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(401).json({ message: "Not authorized" });
  }
};

// @desc    Update Watch History (✅ ATOMIC & VALIDATED)
const updateHistory = async (req, res) => {
    try {
        let { contentId, onModel, progress, duration, season, episode } = req.body;
        const userId = req.user.id; 

        // 1. Validate Input
        if (!contentId || !onModel) {
            return res.status(400).json({ message: "Missing contentId or onModel" });
        }

        // 2. Fix Case Sensitivity ("movie" -> "Movie")
        const validModelName = onModel.charAt(0).toUpperCase() + onModel.slice(1).toLowerCase();
        if (validModelName !== "Movie" && validModelName !== "Series") {
            return res.status(400).json({ message: "Invalid onModel" });
        }

        // 3. Create History Object
        const newHistoryItem = {
            contentId: new mongoose.Types.ObjectId(contentId), // ✅ Force ObjectId
            onModel: validModelName,
            progress: progress || 0,
            duration: duration || 0,
            season,
            episode,
            lastWatched: new Date()
        };

        // 4. Atomic Updates (No VersionError)
        await User.findByIdAndUpdate(userId, {
            $pull: { watchHistory: { contentId: new mongoose.Types.ObjectId(contentId) } }
        });

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            {
                $push: {
                    watchHistory: {
                        $each: [newHistoryItem],
                        $position: 0,
                        $slice: 50
                    }
                }
            },
            { new: true, select: "watchHistory", runValidators: true }
        );

        if (!updatedUser) return res.status(404).json({ message: "User not found" });
        res.status(200).json(updatedUser.watchHistory);

    } catch (error) {
        console.error("History Update Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
};

// @desc    Logout
const logout = async (req, res) => {
  res.cookie('token', '', { httpOnly: true, expires: new Date(0) });
  res.status(200).json({ message: "Logged out" });
};

module.exports = { register, login, getMe, logout, updateHistory };