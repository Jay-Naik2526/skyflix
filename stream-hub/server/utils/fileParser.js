const PATTERNS = {
    // 1. Standard: "Show Name S01E01" or "s1e1"
    STANDARD: /^(.*?)[\s\.]?[sS](\d{1,2})[eE](\d{1,2})/,
    
    // 2. X-Notation: "Show Name 1x01"
    X_NOTATION: /^(.*?)[\s\.]?(\d{1,2})x(\d{1,2})/,
    
    // 3. Full Text: "Show Name Season 1 Episode 1"
    FULL_TEXT: /^(.*?)[\s\.]?Season\s?(\d{1,2})[\s\.]?Episode\s?(\d{1,2})/i,
    
    // 4. Movie Year: "Movie Name (2022)" or "Movie.Name.2022"
    MOVIE_YEAR: /^(.*?)[\s\.\(](\d{4})[\)\s\.]/
  };
  
  const parseFileName = (fileName) => {
    // Clean up common junk (1080p, HDRip, etc) for cleaner title matching
    const cleanName = fileName
      .replace(/\b(1080p|720p|480p|WEBRip|Bluray|x264|x265|AAC|MKV|MP4)\b/gi, "")
      .replace(/[\.\-_]/g, " ") // Replace dots/underscores with spaces
      .trim();
  
    // CHECK FOR SERIES PATTERNS
    let match = fileName.match(PATTERNS.STANDARD) || 
                fileName.match(PATTERNS.X_NOTATION) || 
                fileName.match(PATTERNS.FULL_TEXT);
  
    if (match) {
      return {
        type: "SERIES",
        name: match[1].replace(/[\.\-_]/g, " ").trim(), // "Stranger Things"
        season: parseInt(match[2]), // 1
        episode: parseInt(match[3]), // 1
        rawName: fileName
      };
    }
  
    // CHECK FOR MOVIE PATTERN
    match = fileName.match(PATTERNS.MOVIE_YEAR);
    if (match) {
      return {
        type: "MOVIE",
        name: match[1].replace(/[\.\-_]/g, " ").trim(), // "Life In A Year"
        year: match[2], // "2020"
        rawName: fileName
      };
    }
  
    // FALLBACK (Treat as Movie if no year found, but risky)
    return { 
      type: "MOVIE", 
      name: cleanName, 
      year: new Date().getFullYear().toString(),
      rawName: fileName 
    };
  };
  
  module.exports = { parseFileName };