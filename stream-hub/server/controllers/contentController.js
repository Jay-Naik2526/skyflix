const Movie = require("../models/Movie");
const Series = require("../models/Series");
const Homepage = require("../models/Homepage");
const Request = require("../models/Request"); // <--- Import New Model

// --- HELPER: Sort Series (S1, S2... E1, E2...) ---
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

// --- HELPER: Fetch Category (Only items with posters) ---
const fetchCategory = async (Model, query, limit = 20) => {
    // Ensure we only show items that are fully synced (have a poster)
    const filter = { ...query, poster_path: { $ne: null, $ne: "" } };
    const items = await Model.find(filter).sort({ createdAt: -1 }).limit(limit).lean();
    return items.map(i => ({ ...i, type: Model.modelName }));
};

// --- 1. GET PROPER OTT HOME CONTENT ---
const getHomeContent = async (req, res) => {
  try {
    console.log("Fetching OTT Home Content...");

    // 1. Fetch Admin Banner Config
    let heroSlides = [];
    try {
        const config = await Homepage.findOne().populate('bannerItems.contentId');
        if (config && config.bannerItems?.length > 0) {
            heroSlides = config.bannerItems
                .filter(item => item.contentId) // Filter out broken links
                .map(item => ({ 
                    ...item.contentId._doc, 
                    type: item.onModel 
                }));
        }
    } catch (err) { console.error("Banner Error:", err.message); }

    // 2. Run Parallel Content Queries
    const [
        latestMovies,
        latestSeries,
        topRated,
        action,
        sciFiMovies,
        sciFiSeries,
        comedyMovies,
        comedySeries,
        horror,
        anime
    ] = await Promise.all([
        // A. Latest Uploads
        fetchCategory(Movie, {}, 20),
        fetchCategory(Series, {}, 20),

        // B. Top Rated (Rating > 7.5)
        Movie.find({ vote_average: { $gte: 7.5 }, poster_path: { $ne: null } }).sort({ vote_average: -1 }).limit(15).lean(),

        // C. Action Movies (Genre ID: 28)
        fetchCategory(Movie, { genre_ids: "28" }, 15),

        // D. Sci-Fi (Movie: 878, Series: 10765)
        fetchCategory(Movie, { genre_ids: "878" }, 10),
        fetchCategory(Series, { genre_ids: "10765" }, 10),

        // E. Comedy (Genre ID: 35)
        fetchCategory(Movie, { genre_ids: "35" }, 10),
        fetchCategory(Series, { genre_ids: "35" }, 10),

        // F. Horror (Genre ID: 27)
        fetchCategory(Movie, { genre_ids: "27" }, 15),

        // G. Animation/Anime (Genre ID: 16)
        fetchCategory(Series, { genre_ids: "16" }, 15)
    ]);

    // 3. Fallback Banner if Admin didn't set one
    if (heroSlides.length === 0) {
        heroSlides = topRated.slice(0, 5).map(m => ({ ...m, type: "Movie" }));
    }

    // 4. Combine Mixed Categories
    const sciFiContent = [...sciFiMovies, ...sciFiSeries].sort(() => 0.5 - Math.random());
    const comedyContent = [...comedyMovies, ...comedySeries].sort(() => 0.5 - Math.random());

    // 5. Structure Response
    const responseData = {
        banner: heroSlides,
        sections: [
            { title: "Latest Movies", data: latestMovies },
            { title: "New Episodes", data: sortSeries(latestSeries) },
            { title: "Top Rated Hits", data: topRated.map(m => ({...m, type:"Movie"})) },
            { title: "Action Blockbusters", data: action },
            { title: "Sci-Fi & Fantasy", data: sciFiContent },
            { title: "Comedy Club", data: comedyContent },
            { title: "Bone Chilling Horror", data: horror },
            { title: "Anime World", data: sortSeries(anime) },
        ]
    };

    res.json(responseData);

  } catch (error) {
    console.error("Home Content Error:", error);
    res.status(500).json({ error: error.message });
  }
};

// --- 2. GET ALL MOVIES ---
const getMovies = async (req, res) => {
  try {
    const movies = await Movie.find().sort({ createdAt: -1 }).lean();
    res.json(movies.map(m => ({ ...m, type: "Movie" })));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// --- 3. GET ALL SERIES ---
const getSeries = async (req, res) => {
  try {
    let series = await Series.find().sort({ createdAt: -1 }).lean();
    series = sortSeries(series);
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
    const movies = await Movie.find({ title: regex }).lean();
    let series = await Series.find({ name: regex }).lean();

    series = sortSeries(series);

    const results = [
      ...movies.map(m => ({ ...m, type: "Movie" })),
      ...series.map(s => ({ ...s, type: "Series" }))
    ];

    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// --- 5. NEW: REQUEST CONTENT ---
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