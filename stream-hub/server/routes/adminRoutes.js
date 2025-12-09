const express = require("express");
const router = express.Router();
const { 
  getRPMFiles, renameRPMFiles, 
  getAllPosts, getPostDetails, updatePost, deletePost, 
  getHomepageConfig, updateHomepageConfig, getDuplicates, deleteAllPosts 
} = require("../controllers/adminController");

// Import External Controllers
const { syncContent } = require("../controllers/syncController");
const { fetchMetadata } = require("../controllers/metadataController"); 

// --- ROUTES ---

// File Management (Rename Tool)
router.get("/files", getRPMFiles);
router.post("/rename", renameRPMFiles);

// Post Management (CRUD)
router.get("/posts", getAllPosts);
router.get("/post-details", getPostDetails);
router.post("/update-post", updatePost);
router.delete("/delete-post", deletePost);
router.delete("/delete-all", deleteAllPosts); // <--- RESET DB ROUTE

// Homepage Layout
router.get("/homepage", getHomepageConfig);
router.post("/homepage", updateHomepageConfig);

// Tools
router.get("/duplicates", getDuplicates);

// Actions
router.post("/sync", syncContent);       // <--- SYNC ROUTE
router.post("/metadata", fetchMetadata); // <--- METADATA ROUTE

module.exports = router;