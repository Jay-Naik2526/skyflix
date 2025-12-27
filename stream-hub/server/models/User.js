// server/models/User.js
const mongoose = require("mongoose");

const HistoryItemSchema = new mongoose.Schema({
  contentId: { type: mongoose.Schema.Types.ObjectId, required: true }, 
  title: String,           // Series or Movie Name
  episodeTitle: String,    // Specific Episode Name (e.g., "The Beginning")
  poster_path: String,     // Season or Movie Poster
  episodePoster: String,   // Episode Still Path
  vote_average: { type: Number, default: 0 },
  onModel: { type: String, required: true, enum: ['Movie', 'Series'] },
  
  // ✅ Precise tracking
  season: { type: Number },
  episode: { type: Number },
  
  progress: { type: Number, default: 0 }, 
  duration: { type: Number, default: 0 }, 
  lastWatched: { type: Date, default: Date.now }
});

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  avatar: { type: String, default: "https://upload.wikimedia.org/wikipedia/commons/0/0b/Netflix-avatar.png" },
  watchHistory: [HistoryItemSchema], 
  myList: [{
    contentId: { type: mongoose.Schema.Types.ObjectId, refPath: 'onModel' },
    onModel: { type: String, enum: ['Movie', 'Series'] },
    addedAt: { type: Date, default: Date.now }
  }],
  isAdmin: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model("User", UserSchema);