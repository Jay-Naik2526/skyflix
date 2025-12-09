const axios = require("axios");
const Movie = require("../models/Movie");
const Series = require("../models/Series");
require("dotenv").config();

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = "https://api.themoviedb.org/3";

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const cleanTitle = (rawTitle) => {
  if (!rawTitle) return "";
  let cleaned = rawTitle;
  cleaned = cleaned.replace(/\{.*?\}/g, "");
  cleaned = cleaned.replace(/\[.*?\]/g, "");
  cleaned = cleaned.replace(/\(.*?\)/g, "");
  const junkRegex = /\b(1080p|720p|480p|2160p|4k|WEB-DL|WEB\sDL|WEBRip|BluRay|DVDRip|ESub|Dual\sAudio|Hindi|English|x264|x265|HEVC|AAC|DDP5\.1|H\.264)\b/gi;
  cleaned = cleaned.replace(junkRegex, "");
  cleaned = cleaned.replace(/(\.| )?(mkv|mp4|avi|webm|flv)/gi, "");
  cleaned = cleaned.replace(/\b(19|20)\d{2}\b/g, "");
  cleaned = cleaned.replace(/[\.\-\_]/g, " ");
  cleaned = cleaned.replace(/\s+/g, " ").trim();
  return cleaned;
};

const runBackgroundUpdate = async () => {
  console.log("🚀 BACKGROUND JOB STARTED: Deep Fetch (Series Episodes & Posters)...");

  let processing = true;
  let batchSize = 10; 
  let totalUpdated = 0;
  
  // ✅ SAFETY VALVE: Tracks items we already tried in this session.
  // This prevents infinite loops if a series has an unfixable episode.
  const processedIds = new Set();

  while (processing) {
    try {
      // Find items missing IDs OR Series with generic episode names
      const criteria = {
        $or: [
          { tmdbId: null },
          { tmdbId: "NOT_FOUND" },
          { tmdbId: { $exists: false } },
          { poster_path: null },
          // Also find series where ANY episode is still named "Episode 1"
          { "seasons.episodes.name": "Episode 1" }
        ]
      };

      // Prioritize Newest
      const moviesBatch = await Movie.find(criteria).sort({ createdAt: -1 }).limit(batchSize);
      let seriesBatch = [];
      if (moviesBatch.length < batchSize) {
        seriesBatch = await Series.find(criteria).sort({ createdAt: -1 }).limit(batchSize - moviesBatch.length);
      }

      const allItems = [...moviesBatch, ...seriesBatch];

      // FILTER: Only keep items we haven't touched yet
      const newItems = allItems.filter(item => !processedIds.has(item._id.toString()));

      if (newItems.length === 0) {
        console.log(`🏁 ALL DONE! Queue empty (or all remaining items skipped). Total fixed: ${totalUpdated}`);
        processing = false;
        break;
      }

      for (const item of newItems) {
        // ✅ Add to memory so we don't process this ID again until restart
        processedIds.add(item._id.toString());

        // Skip if it looks fully complete (Double check)
        const isSeries = !!item.seasons;
        if (!isSeries && item.tmdbId && item.poster_path) continue;

        const rawName = isSeries ? item.name : item.title;
        const cleanQuery = cleanTitle(rawName);

        if (!cleanQuery) {
          item.tmdbId = "SKIPPED_EMPTY";
          await item.save();
          continue;
        }

        try {
          const type = isSeries ? "tv" : "movie";
          
          // 1. SEARCH FOR THE MAIN SHOW/MOVIE
          if (!item.tmdbId || item.tmdbId === "NOT_FOUND" || item.tmdbId === "MANUAL_CHECK") {
             const searchUrl = `${TMDB_BASE_URL}/search/${type}?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(cleanQuery)}&include_adult=true`;
             console.log(`🔎 Searching: "${cleanQuery}"...`);
             
             const searchRes = await axios.get(searchUrl);
             
             if (searchRes.data.results?.length > 0) {
                const bestMatch = searchRes.data.results[0];
                item.tmdbId = bestMatch.id;
                item.overview = bestMatch.overview;
                item.poster_path = bestMatch.poster_path ? "https://image.tmdb.org/t/p/w500" + bestMatch.poster_path : "";
                item.backdrop_path = bestMatch.backdrop_path ? "https://image.tmdb.org/t/p/original" + bestMatch.backdrop_path : "";
                item.vote_average = bestMatch.vote_average;
                
                if (!isSeries) {
                    item.title = bestMatch.title;
                    item.release_date = bestMatch.release_date;
                } else {
                    item.name = bestMatch.name;
                    item.first_air_date = bestMatch.first_air_date;
                }
                console.log(`✅ MATCHED: ${isSeries ? item.name : item.title}`);
             } else {
                console.log(`❌ No match: "${cleanQuery}"`);
                item.tmdbId = "MANUAL_CHECK";
                await item.save();
                continue; 
             }
          }

          // 2. SERIES ONLY: FETCH EPISODE DETAILS
          if (isSeries && item.tmdbId) {
             console.log(`   📺 Fetching Episodes for: ${item.name}`);
             
             let seriesUpdated = false;

             // Loop through our local seasons
             for (let sIndex = 0; sIndex < item.seasons.length; sIndex++) {
                const season = item.seasons[sIndex];
                
                try {
                    // Ask TMDB for this specific season's data
                    const seasonUrl = `${TMDB_BASE_URL}/tv/${item.tmdbId}/season/${season.season_number}?api_key=${TMDB_API_KEY}`;
                    const seasonRes = await axios.get(seasonUrl);
                    const tmdbEpisodes = seasonRes.data.episodes; 

                    // Match our local file-based episodes to real TMDB data
                    season.episodes.forEach(localEp => {
                        const realEp = tmdbEpisodes.find(t => t.episode_number === localEp.episode_number);
                        if (realEp) {
                            localEp.name = realEp.name; 
                            localEp.overview = realEp.overview;
                            localEp.still_path = realEp.still_path ? "https://image.tmdb.org/t/p/w500" + realEp.still_path : "";
                            seriesUpdated = true;
                        } 
                        // If we can't find a match, we leave it. The "processedIds" set will prevent us from retrying it endlessly.
                    });
                } catch (seasonErr) {
                    console.warn(`   ⚠️ Could not fetch Season ${season.season_number} for ${item.name}`);
                }
                await sleep(200); 
             }
             if (seriesUpdated) console.log(`   ✨ Updated Episodes for ${item.name}`);
          }

          await item.save();
          totalUpdated++;

        } catch (err) {
          console.error(`⚠️ Error: ${err.message}`);
        }
        await sleep(250);
      }
    } catch (err) {
      console.error("Critical Background Error:", err.message);
      await sleep(5000);
    }
  }
};

const fetchMetadata = async (req, res) => {
  runBackgroundUpdate();
  res.json({ message: "Deep Sync Started! Updating Posters & Episode Details..." });
};

module.exports = { fetchMetadata };