const axios = require("axios");
const mongoose = require("mongoose");
const Movie = require("../models/Movie");
const Series = require("../models/Series");
const Homepage = require("../models/Homepage");
const Request = require("../models/Request");
require("dotenv").config();

// --- 1. RENAME TOOL ---
const getRPMFiles = async (req, res) => {
  try {
    const apiKey = process.env.RPMSHARE_API_KEY;
    let allFiles = [];
    let page = 1;
    let hasMore = true;

    console.log("📥 Fetching file list from RPMShare...");

    while (hasMore) {
      const url = `https://rpmshare.com/api/v1/video/manage?page=${page}&perPage=100&limit=100`;
      const response = await axios.get(url, { headers: { 'api-token': apiKey } });
      const data = response.data?.data;

      if (data && Array.isArray(data) && data.length > 0) {
        const simpleFiles = data.map(f => ({ id: f.id, name: f.name }));
        allFiles = [...allFiles, ...simpleFiles];
        
        console.log(`   Page ${page}: Fetched ${data.length} files. (Total: ${allFiles.length})`);

        if (data.length < 100) {
          hasMore = false;
        } else {
          page++;
        }
      } else {
        hasMore = false;
      }
    }

    console.log(`✅ Finished. Returning ${allFiles.length} files.`);
    res.json(allFiles);

  } catch (error) {
    console.error("❌ Error fetching files:", error.message);
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

// --- 2. POST MANAGEMENT (UNIFIED, SEARCHABLE, SORTED) ---
const getAllPosts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;
    const search = req.query.search || "";

    // Build Search Match Stage
    let matchStage = {};
    if (search) {
      const regex = new RegExp(search, "i");
      matchStage = { title: regex };
    }

    // Aggregation Pipeline to Union Movies and Series
    const pipeline = [
      // 1. Start with Movies
      { 
        $addFields: { 
          type: "Movie", 
          // Ensure unified title field
          sortDate: "$createdAt" 
        } 
      },
      // 2. Union with Series
      {
        $unionWith: {
          coll: "series",
          pipeline: [
            { 
              $addFields: { 
                type: "Series", 
                title: "$name", // Map 'name' to 'title' for unified search
                sortDate: "$createdAt"
              } 
            }
          ]
        }
      },
      // 3. Filter by Search Query (if any)
      { $match: matchStage },
      // 4. Sort by Date (Newest First) - Mixed Types
      { $sort: { sortDate: -1 } },
      // 5. Facet for Pagination
      {
        $facet: {
          metadata: [{ $count: "total" }],
          data: [{ $skip: skip }, { $limit: limit }]
        }
      }
    ];

    const results = await Movie.aggregate(pipeline);
    
    const posts = results[0].data;
    const totalItems = results[0].metadata[0] ? results[0].metadata[0].total : 0;

    res.json({
      posts: posts,
      totalPages: Math.ceil(totalItems / limit),
      currentPage: page,
      totalItems: totalItems
    });

  } catch (error) {
    console.error("Get All Posts Error:", error);
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

  try {
    const oldDoc = await Model.findById(id);
    if (!oldDoc) return res.status(404).json({ error: "Post not found" });

    // RPMShare Rename Logic (Only for Movies single file)
    const newTitle = type === "Movie" ? data.title : data.name;
    const oldTitle = type === "Movie" ? oldDoc.title : oldDoc.name;

    if (type === "Movie" && newTitle && newTitle !== oldTitle && oldDoc.fileCode) {
        console.log(`🔄 Renaming on RPMShare: ${oldTitle} -> ${newTitle}`);
        try {
            const apiKey = process.env.RPMSHARE_API_KEY;
            await axios.patch(
                `https://rpmshare.com/api/v1/video/manage/${oldDoc.fileCode}`, 
                { name: newTitle }, 
                { headers: { 'api-token': apiKey } }
            );
            console.log("✅ RPMShare Rename Success");
        } catch (apiErr) {
            console.error("❌ RPMShare Rename Failed:", apiErr.message);
        }
    }

    const { _id, createdAt, __v, ...updateData } = data;
    await Model.findByIdAndUpdate(id, { $set: updateData });
    res.json({ success: true });

  } catch (error) {
    console.error("Update Error:", error);
    res.status(500).json({ error: error.message });
  }
};

// --- UPDATED: DELETE POST (Deletes from DB AND RPMShare) ---
const deletePost = async (req, res) => {
  const { id, type } = req.query;
  const Model = type === "Movie" ? Movie : Series;
  const apiKey = process.env.RPMSHARE_API_KEY;

  try {
    const post = await Model.findById(id);
    if (!post) return res.status(404).json({ error: "Post not found" });

    // 1. DELETE FROM RPMShare
    const filesToDelete = [];

    if (type === "Movie" && post.fileCode) {
      filesToDelete.push(post.fileCode);
    } else if (type === "Series" && post.seasons) {
      // Gather all episode fileCodes
      post.seasons.forEach(season => {
        season.episodes.forEach(ep => {
          if (ep.fileCode) filesToDelete.push(ep.fileCode);
        });
      });
    }

    if (filesToDelete.length > 0) {
      console.log(`🗑️ Deleting ${filesToDelete.length} files from RPMShare...`);
      // RPMShare usually supports single deletes via standard REST DELETE on the resource URL
      for (const fileCode of filesToDelete) {
        try {
          await axios.delete(`https://rpmshare.com/api/v1/video/manage/${fileCode}`, {
            headers: { 'api-token': apiKey }
          });
          console.log(`   ✅ Deleted RPM File: ${fileCode}`);
        } catch (err) {
          console.error(`   ⚠️ Failed to delete RPM File ${fileCode}:`, err.response?.status);
        }
      }
    }

    // 2. DELETE FROM DATABASE
    await Model.findByIdAndDelete(id);
    res.json({ success: true, message: "Deleted from DB and Cloud" });

  } catch (error) {
    console.error("Delete Error:", error);
    res.status(500).json({ error: error.message });
  }
};

// --- 3. HOMEPAGE MANAGEMENT ---
const getHomepageConfig = async (req, res) => {
  let config = await Homepage.findOne().populate('bannerItems.contentId');
  if (!config) {
    config = new Homepage({ bannerItems: [], categories: [] });
    await config.save();
  }
  res.json(config);
};

const updateHomepageConfig = async (req, res) => {
  const { bannerItems, categories } = req.body;
  const cleanBanner = bannerItems.filter(i => i.contentId).map(i => ({
      ...i,
      contentId: i.contentId._id || i.contentId 
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

// --- 7. REQUEST MANAGEMENT ---
const getRequests = async (req, res) => {
  try {
    const requests = await Request.find().sort({ createdAt: -1 });
    res.json(requests);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const deleteRequest = async (req, res) => {
  try {
    await Request.findByIdAndDelete(req.query.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getRPMFiles, renameRPMFiles, getAllPosts, getPostDetails, updatePost, deletePost,
  getHomepageConfig, updateHomepageConfig, getDuplicates, deleteAllPosts, fixDatabaseRules,
  getRequests, deleteRequest
};