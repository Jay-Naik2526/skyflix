const Movie = require("../models/Movie");
const Series = require("../models/Series");
const Homepage = require("../models/Homepage");
const Request = require("../models/Request");

// --- CACHING SETUP ---
let homeCache = null;
let lastCacheTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 Minutes

// --- HELPER: Lightweight Select Fields ---
// We exclude heavy fields (credits, embedCode) to make the download instant
const CARD_FIELDS = "title name poster_path backdrop_path vote_average release_date first_air_date genre_ids original_language overview collectionInfo production_companies keywords content_rating";

// --- HELPER: Sort Series ---
const sortSeries = (seriesList) => {
  return seriesList.map(series => {
    if (series.seasons && series.seasons.length > 0) {
      series.seasons.sort((a, b) => a.season_number - b.season_number);
      series.seasons.forEach(season => {
        if (season.episodes && season.episodes.length > 0) {
          season.episodes.sort((a, b) => a.episode_number - b.episode_number);
        }
      });
    }
    return series;
  });
};

// --- 1. GET OPTIMIZED HOME CONTENT ---
const getHomeContent = async (req, res) => {
  try {
    // 1. Check Cache (Instant Response)
    if (homeCache && (Date.now() - lastCacheTime < CACHE_DURATION)) {
        console.log("🚀 Serving Home Content from Cache");
        return res.json(homeCache);
    }

    console.log("🔄 Calculating Home Content (DB Hit)...");

    // 2. Fetch Data in Parallel (Optimized Queries)
    // We replicate your EXACT frontend filters here using Database Queries
    const [
        latestMovies,
        latestSeries,
        marvelMovies,
        marvelSeries,
        dcMovies,
        dcSeries,
        bollywoodMovies,
        kDramaSeries,
        animeMovies,
        animeSeries,
        kidsMovies,
        kidsSeries,
        collectionItems
    ] = await Promise.all([
        // Standard Rows
        Movie.find({ poster_path: { $ne: null } }).sort({ createdAt: -1 }).limit(20).select(CARD_FIELDS).lean(),
        Series.find({ poster_path: { $ne: null } }).sort({ createdAt: -1 }).limit(20).select(CARD_FIELDS).lean(),

        // Marvel (Regex search for 'marvel')
        Movie.find({ $or: [{ "production_companies.name": /marvel/i }, { "keywords.name": /marvel/i }] }).select(CARD_FIELDS).lean(),
        Series.find({ $or: [{ "production_companies.name": /marvel/i }, { "keywords.name": /marvel/i }] }).select(CARD_FIELDS).lean(),

        // DC
        Movie.find({ $or: [{ "production_companies.name": /dc entertainment|dc comics/i }, { "keywords.name": /dc comics/i }] }).select(CARD_FIELDS).lean(),
        Series.find({ $or: [{ "production_companies.name": /dc entertainment|dc comics/i }, { "keywords.name": /dc comics/i }] }).select(CARD_FIELDS).lean(),

        // Regional
        Movie.find({ original_language: "hi" }).select(CARD_FIELDS).lean(),
        Series.find({ original_language: "ko" }).select(CARD_FIELDS).lean(),

        // Anime (Japanese + Animation genre OR 'anime' keyword)
        Movie.find({ original_language: "ja", $or: [{ genre_ids: "16" }, { "keywords.name": "anime" }] }).select(CARD_FIELDS).lean(),
        Series.find({ original_language: "ja", $or: [{ genre_ids: "16" }, { "keywords.name": "anime" }] }).select(CARD_FIELDS).lean(),

        // Kids (Exclude Adult, Include Family/Animation/Kids keywords)
        Movie.find({ 
            content_rating: { $nin: ["R", "TV-MA"] },
            $or: [{ genre_ids: { $in: ["10751", "16"] } }, { "keywords.name": /cartoon|kids|children/i }] 
        }).select(CARD_FIELDS).lean(),
        Series.find({ 
            content_rating: { $nin: ["R", "TV-MA"] },
            $or: [{ genre_ids: { $in: ["10751", "16"] } }, { "keywords.name": /cartoon|kids|children/i }] 
        }).select(CARD_FIELDS).lean(),

        // Dynamic Collections (Any item with collectionInfo)
        Movie.find({ "collectionInfo.name": { $exists: true, $ne: null } }).select(CARD_FIELDS).lean()
    ]);

    // 3. Process & Merge Data
    const normalize = (items, type) => items.map(i => ({ ...i, type }));

    // Merge Series & Movies for sections
    const marvelContent = [...normalize(marvelMovies, "Movie"), ...normalize(marvelSeries, "Series")];
    const dcContent = [...normalize(dcMovies, "Movie"), ...normalize(dcSeries, "Series")];
    const animeContent = [...normalize(animeMovies, "Movie"), ...normalize(animeSeries, "Series")];
    
    // Filter Kids content (Exclude Anime from Kids section if overlapping)
    const rawKids = [...normalize(kidsMovies, "Movie"), ...normalize(kidsSeries, "Series")];
    const animeIds = new Set(animeContent.map(a => a._id.toString()));
    const pureKids = rawKids.filter(k => !animeIds.has(k._id.toString()));

    // Build Dynamic Collections (e.g., "Avengers Collection")
    const collections = {};
    collectionItems.forEach(item => {
        if (item.collectionInfo?.name) {
            const key = item.collectionInfo.name.replace(" Collection", "");
            if (!collections[key]) collections[key] = [];
            collections[key].push({ ...item, type: "Movie" });
        }
    });

    // 4. Construct Sections (Order matters!)
    const sections = [];

    if (marvelContent.length > 0) sections.push({ title: "Marvel Universe", data: marvelContent });
    if (dcContent.length > 0) sections.push({ title: "DC Multiverse", data: dcContent });
    if (bollywoodMovies.length > 0) sections.push({ title: "Bollywood Hits 🇮🇳", data: normalize(bollywoodMovies, "Movie") });
    if (kDramaSeries.length > 0) sections.push({ title: "K-Drama & Korean Hits 🇰🇷", data: normalize(kDramaSeries, "Series") });
    if (animeContent.length > 0) sections.push({ title: "Anime World 🇯🇵", data: animeContent });
    if (pureKids.length > 0) sections.push({ title: "Kids & Family 🎈", data: pureKids });

    // Add Dynamic Collections
    Object.keys(collections).sort().forEach(key => {
        if (collections[key].length > 2) {
            sections.push({ title: `${key} Collection`, data: collections[key] });
        }
    });

    // Add Standard Rows
    if (latestMovies.length > 0) sections.push({ title: "Latest Movies", data: normalize(latestMovies, "Movie") });
    if (latestSeries.length > 0) sections.push({ title: "New Episodes", data: normalize(sortSeries(latestSeries), "Series") });

    const payload = {
        banner: normalize(latestMovies.slice(0, 6), "Movie"), // Top 6 movies as banner
        sections
    };

    // 5. Save to Cache
    homeCache = payload;
    lastCacheTime = Date.now();

    res.json(payload);

  } catch (error) {
    console.error("Home Content Error:", error);
    res.status(500).json({ error: error.message });
  }
};

// --- 2. GET ALL MOVIES (Optimized) ---
const getMovies = async (req, res) => {
  try {
    // Only select what we need for the grid, NOT the whole object
    const movies = await Movie.find()
        .sort({ createdAt: -1 })
        .select(CARD_FIELDS) 
        .lean();
    res.json(movies.map(m => ({ ...m, type: "Movie" })));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// --- 3. GET ALL SERIES (Optimized) ---
const getSeries = async (req, res) => {
  try {
    let series = await Series.find()
        .sort({ createdAt: -1 })
        .select(CARD_FIELDS)
        .lean();
    res.json(series.map(s => ({ ...s, type: "Series" })));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// --- 4. SEARCH FUNCTION (Optimized) ---
const searchContent = async (req, res) => {
  const { query } = req.query;
  if (!query) return res.json([]);

  try {
    const regex = new RegExp(query, "i");
    const movies = await Movie.find({ title: regex }).select(CARD_FIELDS).lean();
    const series = await Series.find({ name: regex }).select(CARD_FIELDS).lean();

    const results = [
      ...movies.map(m => ({ ...m, type: "Movie" })),
      ...series.map(s => ({ ...s, type: "Series" }))
    ];

    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// --- 5. REQUEST CONTENT ---
const requestContent = async (req, res) => {
  try {
    const { title, year, platform } = req.body;
    if (!title) return res.status(400).json({ error: "Movie/Series name is required" });

    await Request.create({ title, year, platform });
    res.json({ success: true, message: "Request received!" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { getHomeContent, getMovies, getSeries, searchContent, requestContent };