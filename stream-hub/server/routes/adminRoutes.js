const express = require("express");
const router = express.Router();
const { 
  getRPMFiles, renameRPMFiles, 
  getAllPosts, getPostDetails, updatePost, deletePost, 
  getHomepageConfig, updateHomepageConfig, getDuplicates, deleteAllPosts, fixDatabaseRules 
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
router.post("/update-post", updatePost); // <--- This matches the frontend now
router.delete("/delete-post", deletePost);
router.delete("/delete-all", deleteAllPosts);

// Homepage
router.get("/homepage", getHomepageConfig);
router.post("/homepage", updateHomepageConfig);

// Tools
router.get("/duplicates", getDuplicates);
router.post("/fix-db", fixDatabaseRules); // <--- Added missing route for "Fix Rules" button

// Actions
router.post("/sync", syncContent);
router.post("/metadata", fetchMetadata);

module.exports = router;