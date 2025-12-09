const axios = require("axios");
require("dotenv").config();

const BASE_URL = "https://api.themoviedb.org/3";
const API_KEY = process.env.TMDB_API_KEY;

// Fetch Movie Metadata
const fetchMovieMeta = async (title, year) => {
  try {
    const searchUrl = `${BASE_URL}/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(title)}&year=${year}`;
    const response = await axios.get(searchUrl);
    return response.data.results.length > 0 ? response.data.results[0] : null;
  } catch (error) {
    console.error(`❌ TMDB Movie Error for ${title}:`, error.message);
    return null;
  }
};

// Fetch Series Metadata
const fetchSeriesMeta = async (name) => {
  try {
    const searchUrl = `${BASE_URL}/search/tv?api_key=${API_KEY}&query=${encodeURIComponent(name)}`;
    const response = await axios.get(searchUrl);
    return response.data.results.length > 0 ? response.data.results[0] : null;
  } catch (error) {
    console.error(`❌ TMDB Series Error for ${name}:`, error.message);
    return null;
  }
};

// Fetch Episode Details
const fetchEpisodeMeta = async (tmdbId, season, episode) => {
  try {
    const url = `${BASE_URL}/tv/${tmdbId}/season/${season}/episode/${episode}?api_key=${API_KEY}`;
    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    return null; 
  }
};

module.exports = { fetchMovieMeta, fetchSeriesMeta, fetchEpisodeMeta };