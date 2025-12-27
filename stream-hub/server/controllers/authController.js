const User = require("../models/User");
const Movie = require("../models/Movie");
const Series = require("../models/Series");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "30d" });
};

// Helper for Cookie Options
const getCookieOptions = () => {
  const isProduction = process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    secure: isProduction, // ✅ Must be TRUE in production (HTTPS)
    sameSite: isProduction ? 'None' : 'Lax' // ✅ Must be NONE for cross-domain auth
  };
};

exports.register = async (req, res) => {
  try {
    const { username, email, password, avatar } = req.body;
    if (!username || !email || !password) return res.status(400).json({ message: "Please add all fields" });
    
    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: "User already exists" });
    
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    const user = await User.create({ username, email, password: hashedPassword, avatar });
    
    if (user) {
      const token = generateToken(user._id);
      // ✅ FIX: Use secure cookie settings
      res.cookie('token', token, getCookieOptions()).status(201).json(user);
    } else {
      res.status(400).json({ message: "Invalid user data" });
    }
  } catch (error) { 
    console.error("Register Error:", error);
    res.status(500).json({ message: "Server Error" }); 
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    
    if (user && (await bcrypt.compare(password, user.password))) {
      const token = generateToken(user._id);
      // ✅ FIX: Use secure cookie settings
      res.cookie('token', token, getCookieOptions()).json(user);
    } else {
      res.status(400).json({ message: "Invalid credentials" });
    }
  } catch (error) { 
    console.error("Login Error:", error);
    res.status(500).json({ message: "Server Error" }); 
  }
};

exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password").lean();
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (error) { 
    res.status(401).json({ message: "Not authorized" }); 
  }
};

exports.updateHistory = async (req, res) => {
    try {
        let { contentId, onModel, progress, duration, season, episode } = req.body;
        const userId = req.user.id; 

        if (!contentId || !onModel) {
            return res.status(400).json({ message: "Missing contentId or onModel" });
        }

        let contentMetadata;
        if (onModel.toLowerCase().includes("movie")) {
            contentMetadata = await Movie.findById(contentId);
        } else {
            contentMetadata = await Series.findById(contentId);
        }

        if (!contentMetadata) return res.status(404).json({ message: "Content not found" });

        // ✅ Precise Metadata Extraction (Preserving your logic)
        let displayPoster = contentMetadata.poster_path;
        let epTitle = "";
        let epStill = "";

        if (onModel.toLowerCase().includes("series") && season) {
            const targetSeason = contentMetadata.seasons?.find(s => s.season_number === Number(season));
            if (targetSeason) {
                if (targetSeason.poster_path) displayPoster = targetSeason.poster_path;
                const targetEpisode = targetSeason.episodes?.find(e => e.episode_number === Number(episode));
                if (targetEpisode) {
                    epTitle = targetEpisode.name;
                    epStill = targetEpisode.still_path;
                }
            }
        }

        const newHistoryItem = {
            contentId: new mongoose.Types.ObjectId(contentId),
            title: contentMetadata.title || contentMetadata.name,
            episodeTitle: epTitle,
            poster_path: displayPoster, 
            episodePoster: epStill,
            vote_average: contentMetadata.vote_average,
            onModel: onModel,
            progress: progress || 0,
            duration: duration || 0,
            season: season ? Number(season) : undefined,
            episode: episode ? Number(episode) : undefined,
            lastWatched: new Date()
        };

        // ✅ Deduplication
        await User.findByIdAndUpdate(userId, {
            $pull: { watchHistory: { contentId: new mongoose.Types.ObjectId(contentId) } }
        });

        // ✅ Push to top
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
            { new: true, select: "watchHistory" }
        );

        res.status(200).json(updatedUser.watchHistory);
    } catch (error) {
        console.error("History Update Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
};

exports.logout = async (req, res) => {
  // ✅ FIX: Clear cookie with same secure settings
  res.cookie('token', '', { 
      httpOnly: true, 
      expires: new Date(0),
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? 'None' : 'Lax'
  });
  res.status(200).json({ message: "Logged out" });
};