const axios = require("axios");
const Movie = require("../models/Movie");
const Series = require("../models/Series");
require("dotenv").config();

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = "https://api.themoviedb.org/3";

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// --- HELPER: Clean Title ---
const cleanTitle = (rawTitle) => {
  if (!rawTitle) return "";
  let cleaned = rawTitle;
  
  cleaned = cleaned.replace(/\{.*?\}/g, "").replace(/\[.*?\]/g, "").replace(/\(\d{4}\)/g, "");
  cleaned = cleaned.replace(/(\.| )?(mkv|mp4|avi|webm|flv)/gi, "");
  
  const junkRegex = /\b(1080p|720p|480p|2160p|4k|5k|HDCAM|WEB-DL|WEBRip|Bluray|BluRay|DVDRip|ESub|Dual\sAudio|Hindi|English|x264|x265|HEVC|AAC|DDP5\.1|H\.264|SKYFLIX|SkyFlix)\b/gi;
  cleaned = cleaned.replace(junkRegex, "");

  cleaned = cleaned.replace(/S\d{1,2}|Season\s?\d{1,2}|E\d{1,2}|Episode\s?\d{1,2}|\d{1,2}x\d{1,2}/gi, "");

  cleaned = cleaned.replace(/[\.\-\_]/g, " ");
  return cleaned.replace(/\s+/g, " ").trim();
};

const extractYear = (rawTitle) => {
  if (!rawTitle) return null;
  const match = rawTitle.match(/[\(\[\.\s](\d{4})[\)\]\.\s]/);
  return match ? match[1] : null;
};

// --- WORKER FUNCTION ---
const processItem = async (item) => {
    const isSeries = !!item.seasons;
    let modified = false;

    const rawName = isSeries ? item.name : item.title;
    const cleanQuery = cleanTitle(rawName);

    if (!cleanQuery) return null;

    let searchYear = item.releaseYear || extractYear(rawName);

    try {
        // --- STEP 1: RESOLVE TMDB ID (If missing) ---
        if (!item.tmdbId || item.tmdbId === "MANUAL_CHECK") {
            const type = isSeries ? "tv" : "movie";
            let searchUrl = `${TMDB_BASE_URL}/search/${type}?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(cleanQuery)}&include_adult=true`;
            if (searchYear) searchUrl += isSeries ? `&first_air_date_year=${searchYear}` : `&year=${searchYear}`;

            let searchRes = await axios.get(searchUrl);

            if (searchRes.data.results.length === 0 && searchYear) {
                const fallbackUrl = `${TMDB_BASE_URL}/search/${type}?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(cleanQuery)}&include_adult=true`;
                searchRes = await axios.get(fallbackUrl);
            }

            if (searchRes.data.results?.length > 0) {
                const bestMatch = searchRes.data.results[0];
                item.tmdbId = bestMatch.id;
                item.genre_ids = bestMatch.genre_ids || []; 
                item.vote_average = bestMatch.vote_average;
                
                // ✅ FIX: Save Release Date!
                if (isSeries) {
                    if (bestMatch.first_air_date) item.first_air_date = bestMatch.first_air_date;
                } else {
                    if (bestMatch.release_date) {
                        item.release_date = bestMatch.release_date;
                        item.releaseYear = parseInt(bestMatch.release_date.split("-")[0]); // Sync Year
                    }
                }

                if (!item.poster_path) item.poster_path = bestMatch.poster_path ? "https://image.tmdb.org/t/p/w500" + bestMatch.poster_path : "";
                if (!item.backdrop_path) item.backdrop_path = bestMatch.backdrop_path ? "https://image.tmdb.org/t/p/original" + bestMatch.backdrop_path : "";
                if (!item.overview) item.overview = bestMatch.overview;

                modified = true;
            } else {
                item.tmdbId = "MANUAL_CHECK";
                await item.save();
                return `❌ No match: ${cleanQuery}`;
            }
        }

        // --- STEP 2: FETCH FULL DETAILS ---
        if (item.tmdbId && item.tmdbId !== "MANUAL_CHECK") {
            const currentOverview = item.overview ? item.overview.trim() : "";
            const hasBadOverview = !currentOverview || currentOverview === "Syncing metadata..." || currentOverview === "Fetching details...";
            const missingPremium = !item.production_companies || item.production_companies.length === 0;
            const missingDate = isSeries ? !item.first_air_date : !item.release_date; // Check date

            if (hasBadOverview || missingPremium || missingDate) {
                const type = isSeries ? "tv" : "movie";
                const append = isSeries ? "keywords,credits,content_ratings" : "keywords,credits,release_dates";
                const detailUrl = `${TMDB_BASE_URL}/${type}/${item.tmdbId}?api_key=${TMDB_API_KEY}&append_to_response=${append}`;
                
                try {
                    const detailRes = await axios.get(detailUrl);
                    const details = detailRes.data;

                    if (hasBadOverview) {
                        item.overview = details.overview || "";
                        modified = true;
                    }

                    // ✅ FIX: Ensure Date is saved on detail refresh
                    if (isSeries) {
                        if (details.first_air_date && item.first_air_date !== details.first_air_date) {
                            item.first_air_date = details.first_air_date;
                            modified = true;
                        }
                    } else {
                        if (details.release_date && item.release_date !== details.release_date) {
                            item.release_date = details.release_date;
                            if (details.release_date) item.releaseYear = parseInt(details.release_date.split("-")[0]);
                            modified = true;
                        }
                    }

                    if (!item.original_language || item.original_language !== details.original_language) {
                        item.original_language = details.original_language;
                        modified = true;
                    }

                    if (details.production_companies && (!item.production_companies || item.production_companies.length === 0)) {
                        item.production_companies = details.production_companies.map(c => ({ name: c.name, id: c.id, logo_path: c.logo_path }));
                        modified = true;
                    }

                    if (details.keywords) {
                        const kws = details.keywords.results || details.keywords.keywords;
                        if (kws && (!item.keywords || item.keywords.length === 0)) {
                            item.keywords = kws.map(k => ({ name: k.name, id: k.id }));
                            modified = true;
                        }
                    }

                    if (details.credits && (!item.credits || !item.credits.cast || item.credits.cast.length === 0)) {
                        item.credits = {
                            cast: details.credits.cast.slice(0, 10).map(c => ({ id: c.id, name: c.name, character: c.character, profile_path: c.profile_path })),
                            crew: details.credits.crew.filter(c => ["Director", "Writer", "Executive Producer"].includes(c.job)).slice(0, 5).map(c => ({ id: c.id, name: c.name, job: c.job, profile_path: c.profile_path }))
                        };
                        modified = true;
                    }

                    if (!isSeries && details.belongs_to_collection) {
                        const col = details.belongs_to_collection;
                        if (!item.collectionInfo || item.collectionInfo.id !== col.id) {
                            item.collectionInfo = { id: col.id, name: col.name, poster_path: col.poster_path ? "https://image.tmdb.org/t/p/w500" + col.poster_path : "", backdrop_path: col.backdrop_path ? "https://image.tmdb.org/t/p/original" + col.backdrop_path : "" };
                            modified = true;
                        }
                    }

                    let rating = null;
                    if (isSeries && details.content_ratings) {
                        const usRating = details.content_ratings.results.find(r => r.iso_3166_1 === "US");
                        rating = usRating ? usRating.rating : (details.content_ratings.results[0]?.rating || null);
                    } else if (!isSeries && details.release_dates) {
                        const usRelease = details.release_dates.results.find(r => r.iso_3166_1 === "US");
                        if (usRelease) {
                            const certified = usRelease.release_dates.find(d => d.certification !== "");
                            rating = certified ? certified.certification : null;
                        }
                    }
                    
                    if (rating && item.content_rating !== rating) {
                        item.content_rating = rating;
                        modified = true;
                    }

                } catch (e) { }
            }
        }

        // --- STEP 3: SYNC EPISODES ---
        if (isSeries && item.tmdbId && item.tmdbId !== "MANUAL_CHECK") {
            const seasonPromises = item.seasons.map(async (season) => {
                try {
                    const seasonUrl = `${TMDB_BASE_URL}/tv/${item.tmdbId}/season/${season.season_number}?api_key=${TMDB_API_KEY}`;
                    const seasonRes = await axios.get(seasonUrl);
                    const tmdbEpisodes = seasonRes.data.episodes;
                    if (tmdbEpisodes) {
                        season.episodes.forEach(localEp => {
                            const realEp = tmdbEpisodes.find(t => t.episode_number === localEp.episode_number);
                            if (realEp) {
                                if (!localEp.name || /^Episode \d+$/i.test(localEp.name)) { localEp.name = realEp.name; modified = true; }
                                if (!localEp.overview) { localEp.overview = realEp.overview; modified = true; }
                                if (!localEp.still_path) { localEp.still_path = realEp.still_path ? "https://image.tmdb.org/t/p/w500" + realEp.still_path : ""; modified = true; }
                            }
                        });
                    }
                } catch (e) { }
            });
            await Promise.all(seasonPromises);
        }

        if (modified) {
            if (isSeries) { 
                item.markModified('seasons'); 
                item.markModified('seasons.episodes'); 
            } else {
                item.markModified('collectionInfo');
            }
            item.markModified('credits');
            item.markModified('production_companies');
            item.markModified('keywords');
            
            await item.save();
            return `✅ UPDATED: ${cleanQuery}`;
        }
        return null;

    } catch (err) {
        return `⚠️ Error ${cleanQuery}: ${err.message}`;
    }
};

const runBackgroundUpdate = async () => {
  console.log("🚀 MASTER SYNC STARTED...");
  let processing = true;
  let batchSize = 20; 
  let totalUpdated = 0;
  const processedIds = new Set();

  while (processing) {
    try {
        const criteria = {
            _id: { $nin: Array.from(processedIds) },
            $or: [
                { tmdbId: null },
                { tmdbId: "MANUAL_CHECK" },
                { overview: null },      
                { overview: "" },        
                { overview: "Syncing metadata..." },
                { production_companies: { $exists: false } }, 
                // ✅ Catch items missing dates
                { release_date: null }, 
                { first_air_date: null }
            ]
        };

        const seriesBatch = await Series.find(criteria).limit(batchSize);
        const moviesBatch = await Movie.find(criteria).limit(batchSize);
        const newItems = [...seriesBatch, ...moviesBatch];

        if (newItems.length === 0) {
            console.log(`🏁 SYNC COMPLETE! Total Items Processed: ${totalUpdated}`);
            processing = false;
            break;
        }

        const results = await Promise.all(newItems.map(item => {
            processedIds.add(item._id.toString());
            return processItem(item);
        }));

        const validLogs = results.filter(r => r !== null);
        totalUpdated += validLogs.length;
        if (validLogs.length > 0) console.log(validLogs.join('\n'));

        await sleep(1000); 

    } catch (err) {
        console.error("Critical Error:", err.message);
        await sleep(5000);
    }
  }
};

const fetchMetadata = async (req, res) => {
  runBackgroundUpdate();
  res.json({ message: "Master Sync Started! Check console." });
};

module.exports = { fetchMetadata };