const mongoose = require("mongoose");

// Sub-schema for Watch History
const HistoryItemSchema = new mongoose.Schema({
  contentId: { type: mongoose.Schema.Types.ObjectId, required: true, refPath: 'onModel' }, // Dynamic Link
  onModel: { type: String, required: true, enum: ['Movie', 'Series'] },
  
  // Series Specifics
  seriesId: { type: mongoose.Schema.Types.ObjectId, ref: 'Series' }, 
  season: { type: Number },
  episode: { type: Number },
  
  // Progress
  progress: { type: Number, default: 0 }, 
  duration: { type: Number, default: 0 }, 
  lastWatched: { type: Date, default: Date.now }
});

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  
  avatar: { 
    type: String, 
    default: "https://upload.wikimedia.org/wikipedia/commons/0/0b/Netflix-avatar.png" 
  },
  
  watchHistory: [HistoryItemSchema], // ✅ History Array
  
  myList: [{
    contentId: { type: mongoose.Schema.Types.ObjectId, refPath: 'onModel' },
    onModel: { type: String, enum: ['Movie', 'Series'] },
    addedAt: { type: Date, default: Date.now }
  }],

  isAdmin: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model("User", UserSchema);