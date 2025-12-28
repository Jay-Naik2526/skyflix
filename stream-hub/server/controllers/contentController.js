const Movie = require("../models/Movie");
const Series = require("../models/Series");
const Homepage = require("../models/Homepage");
const Request = require("../models/Request");

// --- CACHING SETUP ---
let homeCache = null;
let lastCacheTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 Minutes

// --- HELPER: Lightweight Select Fields ---
// ✅ FIX: Added 'fileCode' and 'embedCode' so the player works!
const CARD_FIELDS = "title name poster_path backdrop_path vote_average release_date first_air_date genre_ids original_language overview collectionInfo production_companies keywords content_rating fileCode embedCode tmdbId";

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
    // 1. Check Cache
    if (homeCache && (Date.now() - lastCacheTime < CACHE_DURATION)) {
        return res.json(homeCache);
    }

    console.log("🔄 Calculating Home Content (DB Hit)...");

    // 2. Fetch Data in Parallel
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

        // Marvel
        Movie.find({ $or: [{ "production_companies.name": /marvel/i }, { "keywords.name": /marvel/i }] }).select(CARD_FIELDS).lean(),
        Series.find({ $or: [{ "production_companies.name": /marvel/i }, { "keywords.name": /marvel/i }] }).select(CARD_FIELDS).lean(),

        // DC
        Movie.find({ $or: [{ "production_companies.name": /dc entertainment|dc comics/i }, { "keywords.name": /dc comics/i }] }).select(CARD_FIELDS).lean(),
        Series.find({ $or: [{ "production_companies.name": /dc entertainment|dc comics/i }, { "keywords.name": /dc comics/i }] }).select(CARD_FIELDS).lean(),

        // Regional
        Movie.find({ original_language: "hi" }).select(CARD_FIELDS).lean(),
        Series.find({ original_language: "ko" }).select(CARD_FIELDS).lean(),

        // Anime
        Movie.find({ original_language: "ja", $or: [{ genre_ids: "16" }, { "keywords.name": "anime" }] }).select(CARD_FIELDS).lean(),
        Series.find({ original_language: "ja", $or: [{ genre_ids: "16" }, { "keywords.name": "anime" }] }).select(CARD_FIELDS).lean(),

        // Kids
        Movie.find({ 
            content_rating: { $nin: ["R", "TV-MA"] },
            $or: [{ genre_ids: { $in: ["10751", "16"] } }, { "keywords.name": /cartoon|kids|children/i }] 
        }).select(CARD_FIELDS).lean(),
        Series.find({ 
            content_rating: { $nin: ["R", "TV-MA"] },
            $or: [{ genre_ids: { $in: ["10751", "16"] } }, { "keywords.name": /cartoon|kids|children/i }] 
        }).select(CARD_FIELDS).lean(),

        // Dynamic Collections
        Movie.find({ "collectionInfo.name": { $exists: true, $ne: null } }).select(CARD_FIELDS).lean()
    ]);

    // 3. Process & Merge
    const normalize = (items, type) => items.map(i => ({ ...i, type }));

    const marvelContent = [...normalize(marvelMovies, "Movie"), ...normalize(marvelSeries, "Series")];
    const dcContent = [...normalize(dcMovies, "Movie"), ...normalize(dcSeries, "Series")];
    const animeContent = [...normalize(animeMovies, "Movie"), ...normalize(animeSeries, "Series")];
    
    const rawKids = [...normalize(kidsMovies, "Movie"), ...normalize(kidsSeries, "Series")];
    const animeIds = new Set(animeContent.map(a => a._id.toString()));
    const pureKids = rawKids.filter(k => !animeIds.has(k._id.toString()));

    const collections = {};
    collectionItems.forEach(item => {
        if (item.collectionInfo?.name) {
            const key = item.collectionInfo.name.replace(" Collection", "");
            if (!collections[key]) collections[key] = [];
            collections[key].push({ ...item, type: "Movie" });
        }
    });

    // 4. Construct Sections
    const sections = [];

    if (marvelContent.length > 0) sections.push({ title: "Marvel Universe", data: marvelContent });
    if (dcContent.length > 0) sections.push({ title: "DC Multiverse", data: dcContent });
    if (bollywoodMovies.length > 0) sections.push({ title: "Bollywood Hits 🇮🇳", data: normalize(bollywoodMovies, "Movie") });
    if (kDramaSeries.length > 0) sections.push({ title: "K-Drama & Korean Hits 🇰🇷", data: normalize(kDramaSeries, "Series") });
    if (animeContent.length > 0) sections.push({ title: "Anime World 🇯🇵", data: animeContent });
    if (pureKids.length > 0) sections.push({ title: "Kids & Family 🎈", data: pureKids });

    Object.keys(collections).sort().forEach(key => {
        if (collections[key].length > 2) {
            sections.push({ title: `${key} Collection`, data: collections[key] });
        }
    });

    if (latestMovies.length > 0) sections.push({ title: "Latest Movies", data: normalize(latestMovies, "Movie") });
    if (latestSeries.length > 0) sections.push({ title: "New Episodes", data: normalize(sortSeries(latestSeries), "Series") });

    const payload = {
        banner: normalize(latestMovies.slice(0, 6), "Movie"),
        sections
    };

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
    const movies = await Movie.find()
        .sort({ createdAt: -1 })
        .select(CARD_FIELDS) // ✅ Includes embedCode now
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
        .select(CARD_FIELDS) // ✅ Includes embedCode now
        .lean();
    res.json(series.map(s => ({ ...s, type: "Series" })));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// --- 4. SEARCH FUNCTION ---
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