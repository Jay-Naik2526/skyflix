const mongoose = require("mongoose");

const EpisodeSchema = new mongoose.Schema({
  episode_number: { type: Number, required: true },
  name: { type: String },
  overview: { type: String },
  still_path: { type: String },

  fileCode: { type: String },
  embedCode: { type: String },
  downloadLink: { type: String },

  isPublished: { type: Boolean, default: true }
});

const SeasonSchema = new mongoose.Schema({
  season_number: { type: Number, required: true },
  name: { type: String },
  poster_path: { type: String },
  episodes: [EpisodeSchema]
});

const SeriesSchema = new mongoose.Schema({
  name: { type: String, required: true }, // Display Name (Updated by TMDB)
  rootName: { type: String, index: true }, // ✅ FIX: Original Folder/File Name (Never changes)
  
  overview: { type: String },
  poster_path: { type: String },
  backdrop_path: { type: String },
  first_air_date: { type: String },
  vote_average: { type: Number, default: 0 },

  tmdbId: { type: String, default: null },
  genre_ids: { type: [String], default: [] },

  seasons: [SeasonSchema],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Series", SeriesSchema);