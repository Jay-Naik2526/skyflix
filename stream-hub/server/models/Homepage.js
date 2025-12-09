const mongoose = require("mongoose");

const HomepageSchema = new mongoose.Schema({
  bannerItems: [{ 
    contentId: { type: mongoose.Schema.Types.ObjectId, required: true, refPath: 'onModel' },
    onModel: { type: String, required: true, enum: ['Movie', 'Series'] },
    customImage: String // Optional override
  }],
  categories: [{
    title: String,
    genreFilter: String, // e.g., "Action" or "All"
    items: [{ type: mongoose.Schema.Types.ObjectId, refPath: 'onModel' }], // Manual picks
    onModel: { type: String, enum: ['Movie', 'Series'] }
  }]
});

module.exports = mongoose.model("Homepage", HomepageSchema);