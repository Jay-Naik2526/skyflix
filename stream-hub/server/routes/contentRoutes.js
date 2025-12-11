const express = require("express");
const router = express.Router();
const { 
  getHomeContent, 
  getMovies, 
  getSeries, 
  searchContent,
  requestContent // <--- Import the new function
} = require("../controllers/contentController");

// Public Routes
router.get("/home", getHomeContent);
router.get("/movies", getMovies);
router.get("/series", getSeries);
router.get("/search", searchContent);
router.post("/request", requestContent); // <--- New Route

module.exports = router;