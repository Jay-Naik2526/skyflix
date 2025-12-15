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
  cleaned = cleaned.replace(/\{.*?\}/g, "").replace(/\[.*?\]/g, "");
  cleaned = cleaned.replace(/\(\d{4}\)/g, "");
  cleaned = cleaned.replace(/(\.| )?(mkv|mp4|avi|webm|flv)/gi, "");
  const junkRegex = /\b(1080p|720p|480p|2160p|4k|5k|HDCAM|WEB-DL|WEBRip|BluRay|DVDRip|ESub|Dual\sAudio|Hindi|English|x264|x265|HEVC|AAC|DDP5\.1|H\.264|SKYFLIX|SkyFlix)\b/gi;
  cleaned = cleaned.replace(junkRegex, "");
  cleaned = cleaned.replace(/[\.\-\_]/g, " ");
  return cleaned.replace(/\s+/g, " ").trim();
};

const runBackgroundUpdate = async () => {
  console.log("🚀 BACKGROUND JOB STARTED: Smart Deep Fetch (Preserves Edits)...");

  let processing = true;
  let batchSize = 10; 
  let totalUpdated = 0;
  const processedIds = new Set();

  while (processing) {
    try {
      // Find items that need metadata (missing TMDB ID, Genres, or Poster)
      // Note: This might pick up manually edited items if they are still missing genres,
      // so the logic below ensures we don't overwrite the manually edited parts.
      const criteria = {
        $or: [
          { tmdbId: null },
          { genre_ids: { $size: 0 } }, 
          { poster_path: null }
        ]
      };

      const moviesBatch = await Movie.find(criteria).sort({ createdAt: -1 }).limit(batchSize);
      let seriesBatch = [];
      if (moviesBatch.length < batchSize) {
        seriesBatch = await Series.find(criteria).sort({ createdAt: -1 }).limit(batchSize - moviesBatch.length);
      }

      const allItems = [...moviesBatch, ...seriesBatch];
      const newItems = allItems.filter(item => !processedIds.has(item._id.toString()));

      if (newItems.length === 0) {
        console.log(`🏁 ALL DONE! Queue empty. Total fixed: ${totalUpdated}`);
        processing = false;
        break;
      }

      for (const item of newItems) {
        processedIds.add(item._id.toString());

        const isSeries = !!item.seasons;
        const rawName = isSeries ? item.name : item.title;
        const cleanQuery = cleanTitle(rawName);

        if (!cleanQuery) {
          item.tmdbId = "SKIPPED_EMPTY";
          await item.save();
          continue;
        }

        let searchYear = item.releaseYear; 
        if (!searchYear) searchYear = extractYear(rawName);

        try {
          const type = isSeries ? "tv" : "movie";
          let searchUrl = `${TMDB_BASE_URL}/search/${type}?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(cleanQuery)}&include_adult=true`;

          if (searchYear) {
             searchUrl += isSeries ? `&first_air_date_year=${searchYear}` : `&year=${searchYear}`;
          }

          console.log(`🔎 Searching: "${cleanQuery}" (Year: ${searchYear || "Any"})...`);
             
          const searchRes = await axios.get(searchUrl);
             
          if (searchRes.data.results?.length > 0) {
            const bestMatch = searchRes.data.results[0];
            
            // --- 1. CORE IDS (Always Update) ---
            const isFirstSync = !item.tmdbId || item.tmdbId === "NOT_FOUND"; // Flag to check if this is the first real sync
            item.tmdbId = bestMatch.id;
            item.genre_ids = bestMatch.genre_ids || []; 
            item.vote_average = bestMatch.vote_average;

            // --- 2. TEXT METADATA (Only if missing or default) ---
            if (!item.overview || item.overview === "Syncing metadata..." || item.overview === "Syncing...") {
                item.overview = bestMatch.overview;
            }

            // --- 3. IMAGES (Only if missing) ---
            // If you edited the poster manually, 'item.poster_path' will exist, so we skip this.
            if (!item.poster_path) {
                item.poster_path = bestMatch.poster_path ? "https://image.tmdb.org/t/p/w500" + bestMatch.poster_path : "";
            }
            if (!item.backdrop_path) {
                item.backdrop_path = bestMatch.backdrop_path ? "https://image.tmdb.org/t/p/original" + bestMatch.backdrop_path : "";
            }

            // --- 4. TITLES & DATES ---
            // Only update title on first sync to allow manual renames to stick
            if (!isSeries) {
                if (isFirstSync && bestMatch.title) item.title = bestMatch.title;
                if (!item.release_date) item.release_date = bestMatch.release_date;
                if (bestMatch.release_date && !item.releaseYear) {
                    item.releaseYear = parseInt(bestMatch.release_date.split('-')[0]);
                }
            } else {
                if (isFirstSync && bestMatch.name) item.name = bestMatch.name;
                if (!item.first_air_date) item.first_air_date = bestMatch.first_air_date;
            }
            
            console.log(`   ✅ MATCHED: ${isSeries ? item.name : item.title}`);
          } else {
            console.log(`   ❌ No match found.`);
            item.tmdbId = "MANUAL_CHECK"; 
            await item.save();
            continue; 
          }

          // --- 5. EPISODES (Only if Series) ---
          if (isSeries && item.tmdbId) {
             for (let sIndex = 0; sIndex < item.seasons.length; sIndex++) {
                const season = item.seasons[sIndex];
                try {
                    const seasonUrl = `${TMDB_BASE_URL}/tv/${item.tmdbId}/season/${season.season_number}?api_key=${TMDB_API_KEY}`;
                    const seasonRes = await axios.get(seasonUrl);
                    const tmdbEpisodes = seasonRes.data.episodes; 
                    
                    season.episodes.forEach(localEp => {
                        const realEp = tmdbEpisodes.find(t => t.episode_number === localEp.episode_number);
                        if (realEp) {
                            // Only update name if it looks generic (e.g., "Episode 1")
                            const isGenericName = /^Episode \d+$/i.test(localEp.name);
                            if (isGenericName || !localEp.name) {
                                localEp.name = realEp.name; 
                            }
                            
                            // Only update overview if missing
                            if (!localEp.overview) {
                                localEp.overview = realEp.overview;
                            }

                            // Only update still/thumbnail if missing
                            if (!localEp.still_path) {
                                localEp.still_path = realEp.still_path ? "https://image.tmdb.org/t/p/w500" + realEp.still_path : "";
                            }
                        } 
                    });
                } catch (e) {}
                await sleep(200); 
             }
          }

          await item.save();
          totalUpdated++;

        } catch (err) {
          console.error(`   ⚠️ Error processing item: ${err.message}`);
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
  res.json({ message: "Deep Sync Started! Fixing missing Genres & Posters (Preserving Manual Edits)..." });
};

module.exports = { fetchMetadata };