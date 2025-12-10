const mongoose = require("mongoose");

const MovieSchema = new mongoose.Schema({
  title: { type: String, required: true },
  // ✅ NEW: Explicitly store the extracted year for accurate matching
  releaseYear: { type: Number, index: true }, 
  
  overview: { type: String },
  poster_path: { type: String },
  backdrop_path: { type: String },
  release_date: { type: String },
  vote_average: { type: Number, default: 0 },

  // CORE FIELDS FOR SYNC
  fileCode: { type: String, unique: true, required: true },
  embedCode: { type: String },
  downloadLink: { type: String },

  tmdbId: { type: String, default: null },
  genre_ids: { type: [String], default: [] },

  createdAt: { type: Date, default: Date.now }
});

// ✅ NEW: Compound index to prevent duplicate titles in the same year at the DB level
MovieSchema.index({ title: 1, releaseYear: 1 });

module.exports = mongoose.model("Movie", MovieSchema);