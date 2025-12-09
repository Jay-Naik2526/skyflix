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
  console.log("--- STARTING FOLDER-AWARE SYNC (SMART SERIES LINKING) ---");
  
  try {
    const apiKey = process.env.RPMSHARE_API_KEY;
    if (!apiKey) return res.status(500).json({ error: "API Key missing" });

    // 1. Load Existing DB Items
    const existingMovieCodes = new Set((await Movie.find().select("fileCode")).map(m => m.fileCode));
    const seriesDocs = await Series.find().select("seasons.episodes.fileCode");
    seriesDocs.forEach(s => s.seasons.forEach(sea => sea.episodes.forEach(ep => existingMovieCodes.add(ep.fileCode))));

    console.log(`✅ Loaded ${existingMovieCodes.size} existing items.`);

    // 2. Fetch Folders
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

    // 3. Scan Folders
    for (const folder of folders) {
        console.log(`\n👉 Scanning Location: [${folder.name}] (ID: ${folder.id})`);
        
        let page = 1;
        let hasMore = true;

        while (hasMore) {
            try {
                const url = `https://rpmshare.com/api/v1/video/manage?page=${page}&perPage=100&per_page=100&limit=100&fld_id=${folder.id}`; 
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

                        console.log(`      Found NEW: ${file.name}`);

                        const filename = file.name;
                        const embedUrl = `${EMBED_BASE_URL}${fileCode}`; 
                        const downloadUrl = `${embedUrl}&dl=1`;

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
                            // --- MOVIE ---
                            let movieTitle = filename.replace(/\(\d{4}\).*/, "").replace(/[\.\-\_]/g, " ").trim();
                            
                            moviesToInsert.push({
                                title: movieTitle,
                                overview: "Syncing metadata...",
                                poster_path: "",
                                fileCode: fileCode,
                                embedCode: `<iframe src="${embedUrl}" width="100%" height="100%" frameborder="0" allowfullscreen></iframe>`,
                                downloadLink: downloadUrl,
                                tmdbId: null 
                            });
                            existingMovieCodes.add(fileCode);
                        }
                    }

                    // SAVE MOVIES
                    if (moviesToInsert.length > 0) {
                        await Movie.insertMany(moviesToInsert, { ordered: false }).catch(e => {});
                        totalAdded += moviesToInsert.length;
                    }

                    // SAVE SERIES (SMART LINKING)
                    for (const [name, episodes] of Object.entries(seriesUpdates)) {
                        const safeName = escapeRegex(name); 
                        
                        // 1. Try finding by ROOT NAME (Best Match)
                        let series = await Series.findOne({ rootName: new RegExp(`^${safeName}$`, 'i') });

                        // 2. If not found, try finding by DISPLAY NAME (Legacy Match)
                        if (!series) {
                            series = await Series.findOne({ name: new RegExp(`^${safeName}$`, 'i') });
                            
                            // If we found it by old name, BACKFILL the rootName so it works perfectly next time
                            if (series) {
                                series.rootName = name;
                                await series.save();
                            }
                        }
                        
                        // 3. Create New if missing
                        if (!series) {
                            series = new Series({ 
                                name: name, 
                                rootName: name, // ✅ Save the original name here
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