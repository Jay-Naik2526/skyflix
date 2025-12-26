const mongoose = require("mongoose");

// Sub-schema for Watch History (Stores where you left off)
const HistoryItemSchema = new mongoose.Schema({
  contentId: { type: mongoose.Schema.Types.ObjectId, required: true, refPath: 'onModel' }, // Links to Movie/Series
  onModel: { type: String, required: true, enum: ['Movie', 'Series'] },
  
  // For Series only
  seriesId: { type: mongoose.Schema.Types.ObjectId, ref: 'Series' }, 
  season: { type: Number },
  episode: { type: Number },
  
  // Progress tracking
  progress: { type: Number, default: 0 }, // In seconds
  duration: { type: Number, default: 0 }, // Total seconds
  lastWatched: { type: Date, default: Date.now }
});

// Sub-schema for My List (Watchlist)
const MyListItemSchema = new mongoose.Schema({
  contentId: { type: mongoose.Schema.Types.ObjectId, required: true, refPath: 'onModel' },
  onModel: { type: String, required: true, enum: ['Movie', 'Series'] },
  addedAt: { type: Date, default: Date.now }
});

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true }, // Will be hashed
  
  avatar: { 
    type: String, 
    default: "https://upload.wikimedia.org/wikipedia/commons/0/0b/Netflix-avatar.png" 
  },

  // The "Netflix" Features
  watchHistory: [HistoryItemSchema],
  myList: [MyListItemSchema],
  
  // Simple preference tracking for future AI
  likedGenres: [{ type: String }], 

  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("User", UserSchema);