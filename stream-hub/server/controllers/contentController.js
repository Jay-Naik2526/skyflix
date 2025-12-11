const Movie = require("../models/Movie");
const Series = require("../models/Series");

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
    console.log("Fetching Full OTT Home Content...");

    // Run ALL queries in parallel for speed
    const [
        latestMovies,
        latestSeries,
        topRatedMovies,
        actionMovies,
        sciFiContent,
        comedyContent,
        horrorMovies,
        animeSeries
    ] = await Promise.all([
        // 1. Latest Uploads
        fetchCategory(Movie, {}, 20),
        fetchCategory(Series, {}, 20),

        // 2. Top Rated (Rating > 7)
        Movie.find({ vote_average: { $gte: 7 }, poster_path: { $ne: null } }).sort({ vote_average: -1 }).limit(20).lean(),

        // 3. Action Movies (Genre ID: 28)
        fetchCategory(Movie, { genre_ids: "28" }, 20),

        // 4. Sci-Fi & Fantasy (Movies: 878, Series: 10765)
        Promise.all([
            fetchCategory(Movie, { genre_ids: "878" }, 10),
            fetchCategory(Series, { genre_ids: "10765" }, 10)
        ]).then(([m, s]) => [...m, ...s].sort(() => 0.5 - Math.random())),

        // 5. Comedy (Genre ID: 35)
        Promise.all([
            fetchCategory(Movie, { genre_ids: "35" }, 10),
            fetchCategory(Series, { genre_ids: "35" }, 10)
        ]).then(([m, s]) => [...m, ...s].sort(() => 0.5 - Math.random())),

        // 6. Horror (Genre ID: 27)
        fetchCategory(Movie, { genre_ids: "27" }, 20),

        // 7. Animation/Anime (Genre ID: 16)
        fetchCategory(Series, { genre_ids: "16" }, 20),
    ]);

    // Format Data for Frontend
    const responseData = {
        // Featured Item (Random high-quality item from Top Rated)
        featured: topRatedMovies[Math.floor(Math.random() * topRatedMovies.length)] || latestMovies[0],
        
        // Dynamic Rows (The "OTT" Shelves)
        sections: [
            { title: "Latest Movies", data: latestMovies },
            { title: "New Episodes & Series", data: sortSeries(latestSeries) },
            { title: "Top Rated Collections", data: topRatedMovies.map(m => ({...m, type: "Movie"})) },
            { title: "Action Blockbusters", data: actionMovies },
            { title: "Sci-Fi & Fantasy Worlds", data: sciFiContent },
            { title: "Comedy Hits", data: comedyContent },
            { title: "Bone Chilling Horror", data: horrorMovies },
            { title: "Animated Adventures", data: sortSeries(animeSeries) },
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

module.exports = { getHomeContent, getMovies, getSeries, searchContent };