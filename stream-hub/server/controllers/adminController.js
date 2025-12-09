const axios = require("axios");
const mongoose = require("mongoose");
const Movie = require("../models/Movie");
const Series = require("../models/Series");
const Homepage = require("../models/Homepage");
require("dotenv").config();

// --- 1. RENAME TOOL ---
const getRPMFiles = async (req, res) => {
  try {
    const apiKey = process.env.RPMSHARE_API_KEY;
    const url = `https://rpmshare.com/api/v1/video/manage?perPage=1000`;
    const response = await axios.get(url, { headers: { 'api-token': apiKey } });
    if (response.data?.data) {
      res.json(response.data.data.map(f => ({ id: f.id, name: f.name })));
    } else {
      res.json([]);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const renameRPMFiles = async (req, res) => {
  const { updates } = req.body;
  const apiKey = process.env.RPMSHARE_API_KEY;
  let results = [];
  for (const item of updates) {
    try {
      await axios.patch(`https://rpmshare.com/api/v1/video/manage/${item.id}`, { name: item.newName }, { headers: { 'api-token': apiKey } });
      results.push({ id: item.id, status: "Success" });
    } catch (err) {
      results.push({ id: item.id, status: "Failed" });
    }
  }
  res.json({ message: "Batch rename complete", results });
};

// --- 2. POST MANAGEMENT (WITH PAGINATION) ---
const getAllPosts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const totalMovies = await Movie.countDocuments();
    const totalSeries = await Series.countDocuments();
    const totalDocs = totalMovies + totalSeries;

    let posts = [];
    
    // Fetch Movies slice
    if (skip < totalMovies) {
        const movies = await Movie.find()
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .select("title overview poster_path type createdAt");
        posts = movies.map(m => ({ ...m._doc, type: "Movie", title: m.title }));
    } 
    
    // Fetch Series slice if needed
    if (posts.length < limit && (totalSeries > 0)) {
        const seriesSkip = Math.max(0, skip - totalMovies);
        const seriesLimit = limit - posts.length;
        
        const series = await Series.find()
            .sort({ createdAt: -1 })
            .skip(seriesSkip)
            .limit(seriesLimit)
            .select("name overview poster_path type createdAt");
            
        const formattedSeries = series.map(s => ({ ...s._doc, type: "Series", title: s.name }));
        posts = [...posts, ...formattedSeries];
    }

    res.json({
      posts: posts,
      totalPages: Math.ceil(totalDocs / limit),
      currentPage: page,
      totalItems: totalDocs
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getPostDetails = async (req, res) => {
  const { id, type } = req.query;
  const Model = type === "Movie" ? Movie : Series;
  const post = await Model.findById(id);
  res.json(post);
};

const updatePost = async (req, res) => {
  const { id, type, data } = req.body;
  const Model = type === "Movie" ? Movie : Series;
  await Model.findByIdAndUpdate(id, { $set: data });
  res.json({ success: true });
};

const deletePost = async (req, res) => {
  const { id, type } = req.query;
  const Model = type === "Movie" ? Movie : Series;
  await Model.findByIdAndDelete(id);
  res.json({ success: true });
};

// --- 3. HOMEPAGE MANAGEMENT ---
const getHomepageConfig = async (req, res) => {
  // ✅ FIX: Added .populate() so the frontend receives full details, not just IDs
  let config = await Homepage.findOne().populate('bannerItems.contentId');
  
  if (!config) {
    config = new Homepage({ bannerItems: [], categories: [] });
    await config.save();
  }
  res.json(config);
};

const updateHomepageConfig = async (req, res) => {
  const { bannerItems, categories } = req.body;
  // Ensure we save just the IDs to the DB
  const cleanBanner = bannerItems.filter(i => i.contentId).map(i => ({
      ...i,
      contentId: i.contentId._id || i.contentId // Handle both populated and unpopulated objects
  }));
  
  await Homepage.findOneAndUpdate({}, { bannerItems: cleanBanner, categories }, { upsert: true });
  res.json({ success: true });
};

// --- 4. DUPLICATE FINDER ---
const getDuplicates = async (req, res) => {
  try {
    const movies = await Movie.aggregate([
      { $group: { _id: "$tmdbId", count: { $sum: 1 }, ids: { $push: "$_id" }, name: { $first: "$title" } } },
      { $match: { count: { $gt: 1 } } }
    ]).allowDiskUse(true);

    res.json({ movies });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// --- 5. DELETE ALL ---
const deleteAllPosts = async (req, res) => {
  try {
    await Movie.deleteMany({});
    await Series.deleteMany({});
    res.json({ message: "All posts deleted successfully." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// --- 6. FIX DB RULES ---
const fixDatabaseRules = async (req, res) => {
  try {
    const movieColl = mongoose.connection.collection("movies");
    const seriesColl = mongoose.connection.collection("series");
    const mIndexes = await movieColl.indexes();
    const sIndexes = await seriesColl.indexes();

    let logs = [];
    for (const idx of mIndexes) {
      if (idx.key.tmdbId) {
        await movieColl.dropIndex(idx.name);
        logs.push(`Dropped Movie Index: ${idx.name}`);
      }
    }
    for (const idx of sIndexes) {
      if (idx.key.tmdbId) {
        await seriesColl.dropIndex(idx.name);
        logs.push(`Dropped Series Index: ${idx.name}`);
      }
    }
    res.json({ message: "Database Rules Fixed", details: logs });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getRPMFiles, renameRPMFiles, getAllPosts, getPostDetails, updatePost, deletePost,
  getHomepageConfig, updateHomepageConfig, getDuplicates, deleteAllPosts, fixDatabaseRules
};