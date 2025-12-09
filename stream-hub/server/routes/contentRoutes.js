const express = require("express");
const router = express.Router();
const { 
  getHomeContent, 
  getMovies, 
  getSeries, 
  searchContent 
} = require("../controllers/contentController");

// Public Routes
router.get("/home", getHomeContent);
router.get("/movies", getMovies);
router.get("/series", getSeries);
router.get("/search", searchContent);

module.exports = router;