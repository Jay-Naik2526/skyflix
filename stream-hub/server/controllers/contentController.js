const Movie = require("../models/Movie");
const Series = require("../models/Series");

// --- HELPER: Sort Series (S1, S2... E1, E2...) ---
const sortSeries = (seriesList) => {
  return seriesList.map(series => {
    // 1. Sort Seasons (1, 2, 3...)
    if (series.seasons && series.seasons.length > 0) {
      series.seasons.sort((a, b) => a.season_number - b.season_number);
      
      // 2. Sort Episodes inside each Season (1, 2, 3...)
      series.seasons.forEach(season => {
        if (season.episodes && season.episodes.length > 0) {
          season.episodes.sort((a, b) => a.episode_number - b.episode_number);
        }
      });
    }
    return series;
  });
};

// --- 1. GET HOME CONTENT ---
const getHomeContent = async (req, res) => {
  try {
    // Fetch latest items
    const movies = await Movie.find().sort({ createdAt: -1 }).limit(20).lean();
    let series = await Series.find().sort({ createdAt: -1 }).limit(20).lean();

    // Apply Sorting to Series
    series = sortSeries(series);

    // Add 'type' field
    const moviesWithType = movies.map(m => ({ ...m, type: "Movie" }));
    const seriesWithType = series.map(s => ({ ...s, type: "Series" }));

    // FEATURED LOGIC: Try to pick something that HAS a poster/backdrop first
    const allContent = [...moviesWithType, ...seriesWithType];
    const contentWithImages = allContent.filter(c => c.backdrop_path && c.backdrop_path.startsWith("http"));
    
    // If we have items with images, pick one randomly. Otherwise pick the newest item.
    const featured = contentWithImages.length > 0 
      ? contentWithImages[Math.floor(Math.random() * contentWithImages.length)]
      : allContent[0] || null;

    res.json({
      featured: featured,
      trending: allContent.sort(() => 0.5 - Math.random()).slice(0, 10), // Random mix
      latestMovies: moviesWithType,
      latestSeries: seriesWithType,
    });
  } catch (error) {
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

// --- 3. GET ALL SERIES (With Sorting) ---
const getSeries = async (req, res) => {
  try {
    let series = await Series.find().sort({ createdAt: -1 }).lean();
    
    // Fix the numbering before sending
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

    // Sort series results too
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