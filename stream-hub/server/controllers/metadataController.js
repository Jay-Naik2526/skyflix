const axios = require("axios");
const Movie = require("../models/Movie");
const Series = require("../models/Series");
require("dotenv").config();

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = "https://api.themoviedb.org/3";

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// --- HELPER: Extract Year from Filename ---
const extractYear = (rawTitle) => {
  if (!rawTitle) return null;
  const match = rawTitle.match(/[\(\[\.\s](\d{4})[\)\]\.\s]/);
  return match ? match[1] : null;
};

// --- HELPER: Clean Title for Search ---
const cleanTitle = (rawTitle) => {
  if (!rawTitle) return "";
  let cleaned = rawTitle;
  
  // Remove brackets/parentheses content
  cleaned = cleaned.replace(/\{.*?\}/g, "").replace(/\[.*?\]/g, "");
  cleaned = cleaned.replace(/\(\d{4}\)/g, "");
  
  // Remove file extensions
  cleaned = cleaned.replace(/(\.| )?(mkv|mp4|avi|webm|flv)/gi, "");
  
  // Remove technical jargon
  const junkRegex = /\b(1080p|720p|480p|2160p|4k|5k|HDCAM|WEB-DL|WEBRip|Bluray|BluRay|DVDRip|ESub|Dual\sAudio|Hindi|English|x264|x265|HEVC|AAC|DDP5\.1|H\.264|SKYFLIX|SkyFlix)\b/gi;
  cleaned = cleaned.replace(junkRegex, "");

  // Remove "S01", "Season 1", "1x01" patterns so "Stranger.Things.S01" -> "Stranger Things"
  cleaned = cleaned.replace(/S\d{1,2}|Season\s?\d{1,2}|E\d{1,2}|Episode\s?\d{1,2}|\d{1,2}x\d{1,2}/gi, "");

  // Normalize separators
  cleaned = cleaned.replace(/[\.\-\_]/g, " ");
  
  return cleaned.replace(/\s+/g, " ").trim();
};

const runBackgroundUpdate = async () => {
  console.log("🚀 BACKGROUND JOB STARTED: Smart Deep Fetch (Fixing Episodes & Images)...");

  let processing = true;
  let batchSize = 10; 
  let totalUpdated = 0;
  const processedIds = new Set();

  while (processing) {
    try {
      // CRITERIA: Find items missing IDs, Posters, OR deeply missing episode data
      const criteria = {
        $or: [
          { tmdbId: null },
          { tmdbId: "MANUAL_CHECK" }, 
          { poster_path: null },
          { genre_ids: { $size: 0 } },
          // Deep check: If any episode has no image or no overview
          { "seasons.episodes.still_path": null },
          { "seasons.episodes.still_path": "" },
          { "seasons.episodes.overview": null },
          { "seasons.episodes.overview": "" }
        ]
      };

      // Prioritize Series since that is where you are having issues
      const seriesBatch = await Series.find(criteria).sort({ createdAt: -1 }).limit(batchSize);
      let moviesBatch = [];
      if (seriesBatch.length < batchSize) {
        moviesBatch = await Movie.find(criteria).sort({ createdAt: -1 }).limit(batchSize - seriesBatch.length);
      }

      const allItems = [...seriesBatch, ...moviesBatch];
      
      // Filter out items processed in this specific run (to avoid infinite loops)
      const newItems = allItems.filter(item => !processedIds.has(item._id.toString()));

      if (newItems.length === 0) {
        console.log(`🏁 ALL DONE! Queue empty. Total fixed: ${totalUpdated}`);
        processing = false;
        break;
      }

      for (const item of newItems) {
        processedIds.add(item._id.toString());
        const isSeries = !!item.seasons;
        let modified = false; // Track if we actually changed anything

        const rawName = isSeries ? item.name : item.title;
        const cleanQuery = cleanTitle(rawName);

        if (!cleanQuery) {
          console.log(`   ⚠️ Skipped empty title: ${rawName}`);
          continue;
        }

        let searchYear = item.releaseYear; 
        if (!searchYear) searchYear = extractYear(rawName);

        try {
          // --- STEP 1: RESOLVE TMDB ID (If missing) ---
          if (!item.tmdbId || item.tmdbId === "MANUAL_CHECK") {
            const type = isSeries ? "tv" : "movie";
            let searchUrl = `${TMDB_BASE_URL}/search/${type}?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(cleanQuery)}&include_adult=true`;
            if (searchYear) searchUrl += isSeries ? `&first_air_date_year=${searchYear}` : `&year=${searchYear}`;

            console.log(`🔎 Searching: "${cleanQuery}" (Year: ${searchYear || "Any"})...`);
            let searchRes = await axios.get(searchUrl);

            // Retry without year if failed
            if (searchRes.data.results.length === 0 && searchYear) {
               const fallbackUrl = `${TMDB_BASE_URL}/search/${type}?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(cleanQuery)}&include_adult=true`;
               searchRes = await axios.get(fallbackUrl);
            }

            if (searchRes.data.results?.length > 0) {
              const bestMatch = searchRes.data.results[0];
              item.tmdbId = bestMatch.id;
              item.genre_ids = bestMatch.genre_ids || []; 
              item.vote_average = bestMatch.vote_average;
              
              if (!item.poster_path) item.poster_path = bestMatch.poster_path ? "https://image.tmdb.org/t/p/w500" + bestMatch.poster_path : "";
              if (!item.backdrop_path) item.backdrop_path = bestMatch.backdrop_path ? "https://image.tmdb.org/t/p/original" + bestMatch.backdrop_path : "";
              if (!item.overview) item.overview = bestMatch.overview;

              modified = true;
              console.log(`   ✅ MATCHED PARENT: ${cleanQuery} -> ID: ${bestMatch.id}`);
            } else {
              console.log(`   ❌ No match found for: ${cleanQuery}`);
              item.tmdbId = "MANUAL_CHECK";
              await item.save();
              continue; 
            }
          }

          // --- STEP 2: SYNC EPISODES (The Critical Fix) ---
          if (isSeries && item.tmdbId && item.tmdbId !== "MANUAL_CHECK") {
             console.log(`      ... Syncing Episodes for ${item.name} (TMDB: ${item.tmdbId})`);
             
             for (let sIndex = 0; sIndex < item.seasons.length; sIndex++) {
                const season = item.seasons[sIndex];
                try {
                    const seasonUrl = `${TMDB_BASE_URL}/tv/${item.tmdbId}/season/${season.season_number}?api_key=${TMDB_API_KEY}`;
                    const seasonRes = await axios.get(seasonUrl);
                    const tmdbEpisodes = seasonRes.data.episodes; 
                    
                    if (tmdbEpisodes) {
                      season.episodes.forEach(localEp => {
                          const realEp = tmdbEpisodes.find(t => t.episode_number === localEp.episode_number);
                          if (realEp) {
                              // FORCE UPDATE if missing or empty
                              if (!localEp.name || /^Episode \d+$/i.test(localEp.name) || /S\d+E\d+/i.test(localEp.name)) {
                                  localEp.name = realEp.name;
                                  modified = true;
                              }
                              if (!localEp.overview || localEp.overview === "") {
                                  localEp.overview = realEp.overview;
                                  modified = true;
                              }
                              if (!localEp.still_path || localEp.still_path === "") {
                                  localEp.still_path = realEp.still_path ? "https://image.tmdb.org/t/p/w500" + realEp.still_path : "";
                                  modified = true;
                              }
                          }
                      });
                    }
                } catch (e) {
                    if (e.response && e.response.status === 404) {
                         console.log(`      ⚠️ TMDB has no data for Season ${season.season_number}`);
                    }
                }
                await sleep(200); // Rate limit protection
             }
          }

          // --- STEP 3: SAVE WITH MARK MODIFIED ---
          if (modified) {
            // CRITICAL FIX: Tell Mongoose deeply nested arrays changed
            if (isSeries) {
              item.markModified('seasons'); 
              item.markModified('seasons.episodes');
            }
            await item.save();
            totalUpdated++;
            console.log(`   💾 SAVED UPDATES for: ${cleanQuery}`);
          } else {
            console.log(`   Last check: No new updates needed for ${cleanQuery}`);
          }

        } catch (err) {
          console.error(`   ⚠️ Error processing item ${item.name || item.title}: ${err.message}`);
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
  res.json({ message: "Deep Sync Started! Fixing missing Genres, Posters, & Episodes..." });
};

module.exports = { fetchMetadata };