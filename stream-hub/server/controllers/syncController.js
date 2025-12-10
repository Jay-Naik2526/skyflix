const axios = require("axios");
const mongoose = require("mongoose");
const Movie = require("../models/Movie");
const Series = require("../models/Series");
require("dotenv").config();

// --- CONFIGURATION ---
const EMBED_BASE_URL = "https://skyflix.rpmplay.me/#"; 

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

function escapeRegex(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); 
}

const syncContent = async (req, res) => {
  console.log("--- STARTING SMART SYNC (YEAR-AWARE) ---");
  
  try {
    const apiKey = process.env.RPMSHARE_API_KEY;
    if (!apiKey) return res.status(500).json({ error: "API Key missing" });

    // 1. Load Existing File Codes to skip identical files
    const existingMovieCodes = new Set((await Movie.find().select("fileCode")).map(m => m.fileCode));
    const seriesDocs = await Series.find().select("seasons.episodes.fileCode");
    seriesDocs.forEach(s => s.seasons.forEach(sea => sea.episodes.forEach(ep => existingMovieCodes.add(ep.fileCode))));

    // 2. Load Existing Movie Titles+Years to skip duplicate entries (different files, same movie)
    const existingMovies = await Movie.find().select("title releaseYear").lean();
    // Create a Set like "The Matrix|1999" for fast lookup
    const existingTitles = new Set(existingMovies.map(m => `${m.title.toLowerCase().trim()}|${m.releaseYear || 0}`));

    console.log(`✅ Loaded ${existingMovieCodes.size} existing items.`);

    // 3. Fetch Folders
    let folders = [];
    try {
        console.log("📂 Fetching Folder Structure...");
        const folderUrl = `https://rpmshare.com/api/v1/folder/list?fld_id=0`;
        const folderRes = await axios.get(folderUrl, { headers: { 'api-token': apiKey } });
        folders.push({ id: 0, name: "ROOT" }); 
        if (folderRes.data?.result?.folders) {
            folders = [...folders, ...folderRes.data.result.folders.map(f => ({ id: f.fld_id, name: f.name }))];
        }
    } catch (err) {
        folders.push({ id: 0, name: "ROOT" });
    }

    let totalAdded = 0;
    let totalSkipped = 0;

    // 4. Scan Folders
    for (const folder of folders) {
        console.log(`\n👉 Scanning Location: [${folder.name}] (ID: ${folder.id})`);
        
        let page = 1;
        let hasMore = true;

        while (hasMore) {
            try {
                const url = `https://rpmshare.com/api/v1/video/manage?page=${page}&perPage=100&limit=100&fld_id=${folder.id}`; 
                const response = await axios.get(url, { headers: { 'api-token': apiKey } });
                const pageData = response.data?.data;

                if (pageData && pageData.length > 0) {
                    console.log(`   📄 Page ${page}: Found ${pageData.length} files.`);
                    
                    const moviesToInsert = [];
                    const seriesUpdates = {}; 

                    for (const file of pageData) {
                        const fileCode = file.id || file.file_code || file.code;
                        if (!fileCode) continue;

                        if (existingMovieCodes.has(fileCode)) {
                            totalSkipped++;
                            continue;
                        }

                        const filename = file.name;
                        const embedUrl = `${EMBED_BASE_URL}${fileCode}`; 
                        const downloadUrl = `${embedUrl}&dl=1`;

                        // REGEX: Detect Series (S01E01)
                        const seriesRegex = /^(.*?)[\s\.\-\_]+S(\d+)[\s\.\-\_]*E(\d+)/i;
                        const seriesMatch = filename.match(seriesRegex);

                        if (seriesMatch) {
                            // --- SERIES ---
                            const rawName = seriesMatch[1].replace(/[\.\-\_]/g, " ").trim();
                            const seasonNum = parseInt(seriesMatch[2]);
                            const episodeNum = parseInt(seriesMatch[3]);
                            
                            if (!seriesUpdates[rawName]) {
                                seriesUpdates[rawName] = [];
                            }
                            seriesUpdates[rawName].push({
                                seasonNum, episodeNum, fileCode, embedUrl, downloadUrl, filename
                            });
                            existingMovieCodes.add(fileCode);

                        } else {
                            // --- MOVIE (SMART PARSING) ---
                            // Regex: Captures "Name" and "(Year)" 
                            // Matches: "Joker (2019).mp4" or "Joker.2019.1080p.mkv"
                            const yearRegex = /^(.*?)(?:[\s\.\(]*)(\d{4})(?:[\)\s\.]*)/;
                            const match = filename.match(yearRegex);

                            let movieTitle = "";
                            let movieYear = 0;

                            if (match) {
                                movieTitle = match[1].replace(/[\.\-\_]/g, " ").trim();
                                movieYear = parseInt(match[2]);
                            } else {
                                // Fallback: Remove extension and junk, hope for the best
                                movieTitle = filename.replace(/\.(mp4|mkv|avi)$/i, "").replace(/[\.\-\_]/g, " ").trim();
                            }

                            // 🔍 DUPLICATE CHECK: Title + Year
                            const uniqueKey = `${movieTitle.toLowerCase()}|${movieYear}`;
                            if (existingTitles.has(uniqueKey)) {
                                console.log(`      ⚠️ Duplicate detected: ${movieTitle} (${movieYear}) - Skipping`);
                                totalSkipped++;
                                continue;
                            }

                            console.log(`      ✅ Adding NEW: ${movieTitle} (${movieYear || "No Year"})`);
                            
                            moviesToInsert.push({
                                title: movieTitle,
                                releaseYear: movieYear || null, // Save extracted year
                                overview: "Syncing metadata...",
                                poster_path: "",
                                fileCode: fileCode,
                                embedCode: `<iframe src="${embedUrl}" width="100%" height="100%" frameborder="0" allowfullscreen></iframe>`,
                                downloadLink: downloadUrl,
                                tmdbId: null 
                            });
                            
                            // Add to our sets so we don't add the same one twice in this run
                            existingMovieCodes.add(fileCode);
                            existingTitles.add(uniqueKey);
                        }
                    }

                    // SAVE MOVIES
                    if (moviesToInsert.length > 0) {
                        try {
                            await Movie.insertMany(moviesToInsert, { ordered: false });
                            totalAdded += moviesToInsert.length;
                        } catch (e) {
                            console.error("Insert Error (likely duplicate code):", e.message);
                        }
                    }

                    // SAVE SERIES
                    for (const [name, episodes] of Object.entries(seriesUpdates)) {
                        const safeName = escapeRegex(name); 
                        let series = await Series.findOne({ rootName: new RegExp(`^${safeName}$`, 'i') });

                        if (!series) {
                            series = await Series.findOne({ name: new RegExp(`^${safeName}$`, 'i') });
                            if (series) {
                                series.rootName = name;
                                await series.save();
                            }
                        }
                        
                        if (!series) {
                            series = new Series({ 
                                name: name, 
                                rootName: name, 
                                overview: "Syncing...", 
                                seasons: [], 
                                tmdbId: null 
                            });
                        }

                        episodes.forEach(ep => {
                            let season = series.seasons.find(s => s.season_number === ep.seasonNum);
                            if (!season) {
                                season = { season_number: ep.seasonNum, name: `Season ${ep.seasonNum}`, episodes: [] };
                                series.seasons.push(season);
                            }
                            if (!season.episodes.find(e => e.episode_number === ep.episodeNum)) {
                                season.episodes.push({
                                    episode_number: ep.episodeNum,
                                    name: `Episode ${ep.episodeNum}`,
                                    fileCode: ep.fileCode,
                                    embedCode: `<iframe src="${ep.embedUrl}" width="100%" height="100%" frameborder="0" allowfullscreen></iframe>`,
                                    downloadLink: ep.downloadUrl,
                                    isPublished: true
                                });
                            }
                        });
                        await series.save();
                    }

                    page++;
                    await sleep(1000); 

                } else {
                    hasMore = false;
                }

            } catch (err) {
                console.error(`   ❌ Error scanning folder ${folder.name}:`, err.message);
                hasMore = false;
            }
        }
    }

    console.log("✅ Final Sync Complete!");
    res.json({ message: "Sync Complete", added: totalAdded, skipped: totalSkipped });

  } catch (error) {
    console.error("Critical Sync Error:", error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = { syncContent };