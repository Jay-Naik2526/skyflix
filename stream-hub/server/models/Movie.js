const mongoose = require("mongoose");

const MovieSchema = new mongoose.Schema({
  title: { type: String, required: true },
  overview: { type: String },
  poster_path: { type: String },
  backdrop_path: { type: String },
  release_date: { type: String },
  vote_average: { type: Number, default: 0 },

  // CORE FIELDS FOR SYNC
  fileCode: { type: String, unique: true, required: true },
  embedCode: { type: String },
  downloadLink: { type: String },

  // FIX: Removed 'required: true' so we can save it as null initially
  tmdbId: { type: String, default: null },
  genre_ids: { type: [String], default: [] },

  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Movie", MovieSchema);