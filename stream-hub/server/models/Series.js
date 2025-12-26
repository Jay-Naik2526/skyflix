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
  name: { type: String, required: true }, 
  rootName: { type: String, index: true },
  
  overview: { type: String },
  poster_path: { type: String },
  backdrop_path: { type: String },
  first_air_date: { type: String },
  vote_average: { type: Number, default: 0 },

  // --- 🌟 NEW: PREMIUM FIELDS (Matching Movie Schema) ---
  
  // 1. Regional Zones (K-Drama, US TV, Anime)
  original_language: { type: String, index: true }, 

  // 2. Franchise/Network Hubs (HBO, Netflix, Marvel)
  production_companies: [{ 
    name: String, 
    id: Number, 
    logo_path: String 
  }],

  // 3. Smart Moods & Collections
  keywords: [{ name: String, id: Number }],

  // 4. Cast & Crew (For "Showrunners" or "Actor Profiles")
  credits: {
    cast: [{
      id: Number,
      name: String,
      character: String,
      profile_path: String
    }],
    crew: [{
      id: Number,
      name: String,
      job: String, 
      profile_path: String
    }]
  },

  // 5. Kids Mode (TV-Y7, TV-MA)
  content_rating: { type: String },
  // --------------------------------------------------

  tmdbId: { type: String, default: null },
  genre_ids: { type: [String], default: [] },

  seasons: [SeasonSchema],
  createdAt: { type: Date, default: Date.now }
});

SeriesSchema.index({ original_language: 1 });

module.exports = mongoose.model("Series", SeriesSchema);