import { useState, useEffect } from "react";
import { fetchMovies, fetchSeries, getMe } from "../services/api"; 
import HeroBanner from "../components/HeroBanner";
import Row from "../components/Row";
import { useOutletContext } from "react-router-dom";

const GENRE_MAP: Record<string, string> = {
  "28": "Action", "12": "Adventure", "16": "Animation", "35": "Comedy",
  "80": "Crime", "99": "Documentary", "18": "Drama", "10751": "Family",
  "14": "Fantasy", "36": "History", "27": "Horror", "10402": "Music",
  "9648": "Mystery", "10749": "Romance", "878": "Sci-Fi", "10770": "TV Movie",
  "53": "Thriller", "10752": "War", "37": "Western", "10759": "Action & Adventure",
  "10765": "Sci-Fi & Fantasy", "10768": "War & Politics"
};

export default function Home() {
  const [heroMovies, setHeroMovies] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]); 
  const [loading, setLoading] = useState(true);

  const context = useOutletContext<any>();
  const onMovieClick = context?.onMovieClick || (() => {});

  useEffect(() => {
    const loadContent = async () => {
      setLoading(true);
      try {
        const [movieRes, seriesRes, userData] = await Promise.all([
          fetchMovies(1, 150),
          fetchSeries(1, 150),
          getMe().catch(() => null)
        ]);

        const movies = movieRes.data || [];
        const seriesData = seriesRes.data || [];

        const processItem = (item: any) => ({
          ...item,
          displayGenres: item.genre_ids?.map((id: string) => GENRE_MAP[id] || "Other") || []
        });

        const allMovies = movies.map(processItem);
        const allSeries = seriesData.map(processItem);
        const allContent = [...allMovies, ...allSeries]; // Full database of content in memory

        // ✅ FIX: Hydrate History with Full Series Data
        if (userData && userData.watchHistory && userData.watchHistory.length > 0) {
            const seenIds = new Set();
            
            const uniqueHistory = userData.watchHistory
                .map((historyItem: any) => {
                    const idStr = historyItem.contentId.toString();
                    if (seenIds.has(idStr)) return null;
                    seenIds.add(idStr);

                    // Find the FULL content object (contains seasons, episodes, etc.)
                    const fullContent = allContent.find(c => c._id === idStr || c.id === idStr);

                    if (!fullContent) return null; // Skip if content is not available

                    // Merge History Progress INTO Full Content Object
                    return {
                        ...fullContent, // Has .seasons, .overview etc.
                        // Overwrite with History specific data
                        season: historyItem.season, // Current specific season
                        episode: historyItem.episode, // Current specific episode
                        episodeTitle: historyItem.episodeTitle,
                        
                        // Use episode poster for the row, fall back to main poster
                        poster_path: historyItem.episodePoster || historyItem.poster_path || fullContent.poster_path,
                        
                        // Custom subtitle for Row.tsx
                        displaySubtitle: historyItem.season 
                            ? `S${historyItem.season} E${historyItem.episode}` 
                            : "Resume"
                    };
                })
                .filter(Boolean); // Remove nulls

            setHistory(uniqueHistory);
        }

        const builtSections: any[] = [];

        // --- Categories Logic (Unchanged) ---
        const marvelItems = allContent.filter((i: any) => 
          i.production_companies?.some((c: any) => c.name.toLowerCase().includes("marvel")) ||
          i.keywords?.some((k: any) => k.name === "marvel comic")
        );
        if (marvelItems.length > 0) builtSections.push({ title: "Marvel Universe", data: marvelItems });

        const dcItems = allContent.filter((i: any) => 
          i.production_companies?.some((c: any) => c.name.toLowerCase().includes("dc entertainment")) ||
          i.keywords?.some((k: any) => k.name === "dc comics")
        );
        if (dcItems.length > 0) builtSections.push({ title: "DC Multiverse", data: dcItems });

        const bollywoodItems = allContent.filter((i: any) => i.original_language === "hi");
        if (bollywoodItems.length > 0) builtSections.push({ title: "Bollywood Hits 🇮🇳", data: bollywoodItems });

        const kDramaItems = allSeries.filter((i: any) => i.original_language === "ko");
        if (kDramaItems.length > 0) builtSections.push({ title: "K-Drama & Korean Hits 🇰🇷", data: kDramaItems });

        const animeItems = allContent.filter((i: any) => 
          (i.original_language === "ja" && i.displayGenres.includes("Animation")) ||
          i.keywords?.some((k: any) => k.name === "anime")
        );
        if (animeItems.length > 0) builtSections.push({ title: "Anime World 🇯🇵", data: animeItems });

        const collections: Record<string, any[]> = {};
        allContent.forEach((item: any) => {
          if (item.collectionInfo?.name) {
             const key = item.collectionInfo.name.replace(" Collection", ""); 
             if (!collections[key]) collections[key] = [];
             collections[key].push(item);
          }
        });

        Object.keys(collections).sort().forEach(key => {
            if (collections[key].length > 2) builtSections.push({ title: `${key} Collection`, data: collections[key] });
        });

        if (allMovies.length > 0) builtSections.push({ title: "Latest Movies", data: allMovies.slice(0, 20) });
        if (allSeries.length > 0) builtSections.push({ title: "Latest TV Shows", data: allSeries.slice(0, 20) });

        setSections(builtSections);
        setHeroMovies(allMovies.slice(0, 6)); 
      } catch (error) {
        console.error("Home loading error:", error);
      } finally {
        setLoading(false);
      }
    };

    loadContent();
  }, []);

  if (loading) return (
    <div className="min-h-screen bg-[#0f1014] flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0f1014] text-white overflow-x-hidden pb-20 relative">
      {heroMovies.length > 0 && <HeroBanner movies={heroMovies} />}
      <div className="relative z-10 -mt-16 md:-mt-10 space-y-8 pl-4 md:pl-12">
        {history.length > 0 && (
            <Row title="Continue Watching" data={history} onMovieClick={onMovieClick} />
        )}
        {sections.map((section, index) => (
          <Row key={index} title={section.title} data={section.data} onMovieClick={onMovieClick} />
        ))}
      </div>
    </div>
  );
}