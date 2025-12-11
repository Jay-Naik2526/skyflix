const express = require("express");
const router = express.Router();
const { 
  getRPMFiles, renameRPMFiles, 
  getAllPosts, getPostDetails, updatePost, deletePost, 
  getHomepageConfig, updateHomepageConfig, getDuplicates, deleteAllPosts, fixDatabaseRules,
  getRequests, deleteRequest // <--- Added these imports
} = require("../controllers/adminController");

// Import External Controllers
const { syncContent } = require("../controllers/syncController");
const { fetchMetadata } = require("../controllers/metadataController"); 

// --- ROUTES ---

// File Management
router.get("/files", getRPMFiles);
router.post("/rename", renameRPMFiles);

// Post Management (CRUD)
router.get("/posts", getAllPosts);
router.get("/post-details", getPostDetails);
router.post("/update-post", updatePost); 
router.delete("/delete-post", deletePost);
router.delete("/delete-all", deleteAllPosts);

// Homepage
router.get("/homepage", getHomepageConfig);
router.post("/homepage", updateHomepageConfig);

// Tools
router.get("/duplicates", getDuplicates);
router.post("/fix-db", fixDatabaseRules);

// ✅ NEW: Request Management
router.get("/requests", getRequests);
router.delete("/delete-request", deleteRequest);

// Actions
router.post("/sync", syncContent);
router.post("/metadata", fetchMetadata);

module.exports = router;