const mongoose = require("mongoose");

const MovieSchema = new mongoose.Schema({
  title: { type: String, required: true },
  releaseYear: { type: Number, index: true }, 
  
  overview: { type: String },
  poster_path: { type: String },
  backdrop_path: { type: String },
  release_date: { type: String },
  vote_average: { type: Number, default: 0 },

  // --- 🌟 NEW: PREMIUM METADATA FIELDS (All Features) ---
  
  // 1. Regional Zones (Bollywood, Hollywood, K-Drama)
  original_language: { type: String, index: true }, 

  // 2. Franchise Hubs (Marvel, DC, Disney)
  production_companies: [{ 
    name: String, 
    id: Number, 
    logo_path: String 
  }],

  // 3. Smart Moods & "Vibe" Search
  keywords: [{ name: String, id: Number }],

  // 4. Cast & Crew (Director Collections)
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
      job: String, // Filter for "Director" or "Writer"
      profile_path: String
    }]
  },

  // 5. Kids Mode & Parental Control
  content_rating: { type: String }, 

  // 6. 🌟 DYNAMIC COLLECTIONS (The New Feature)
  // Stores "Avengers Collection", "Harry Potter Collection" info
  collectionInfo: {
    id: Number,
    name: { type: String, index: true },
    poster_path: String,
    backdrop_path: String
  },
  // --------------------------------------------------

  // CORE FIELDS
  fileCode: { type: String, unique: true, required: true },
  embedCode: { type: String },
  downloadLink: { type: String },

  tmdbId: { type: String, default: null },
  genre_ids: { type: [String], default: [] },

  createdAt: { type: Date, default: Date.now }
});

// Indexes for fast sorting and grouping
MovieSchema.index({ title: 1, releaseYear: 1 });
MovieSchema.index({ original_language: 1 });
MovieSchema.index({ "collectionInfo.name": 1 }); // Important for grouping

module.exports = mongoose.model("Movie", MovieSchema);