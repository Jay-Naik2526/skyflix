import { useState, useEffect } from "react";
import { fetchHomeContent, getMe } from "../services/api"; 
import HeroBanner from "../components/HeroBanner";
import Row from "../components/Row";
import { useOutletContext } from "react-router-dom";

export default function Home() {
  const [heroMovies, setHeroMovies] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]); 
  const [loading, setLoading] = useState(true);

  // This comes from App.tsx (handles DetailModal opening)
  const context = useOutletContext<any>();
  const onMovieClick = context?.onMovieClick || (() => {});

  useEffect(() => {
    const loadContent = async () => {
      setLoading(true);
      try {
        // 1. Fetch Homepage Data & User Data in parallel
        const [homeRes, userData] = await Promise.all([
          fetchHomeContent(),
          getMe().catch(() => null) // Fail silently if not logged in
        ]);

        // 2. Set Banner & Sections from Backend (Fast & Cached)
        if (homeRes) {
            setHeroMovies(homeRes.banner || []);
            setSections(homeRes.sections || []);
        }

        // 3. Process Watch History (The Fix)
        if (userData && userData.watchHistory && userData.watchHistory.length > 0) {
            const seenIds = new Set();
            
            // We need a lookup map for "All Content" to try and find extra details
            // Flatten the sections to search for matches efficiently
            const allAvailableContent = homeRes?.sections?.flatMap((s: any) => s.data) || [];

            const uniqueHistory = userData.watchHistory
                .map((historyItem: any) => {
                    // Prevent Duplicates
                    const idStr = historyItem.contentId.toString();
                    if (seenIds.has(idStr)) return null;
                    seenIds.add(idStr);

                    // Try to find the full object in the currently loaded content
                    // This adds extra data like "seasons" if available
                    const fullContent = allAvailableContent.find((c: any) => c._id === idStr || c.id === idStr);

                    // ✅ FIX: Use stored metadata if full content is missing
                    // This ensures the row APPEARS even if the movie isn't in the top 150
                    return {
                        // Base data from History (Database)
                        _id: historyItem.contentId,
                        id: historyItem.contentId,
                        title: historyItem.title || fullContent?.title,
                        name: historyItem.title || fullContent?.name, // Handle series naming
                        poster_path: historyItem.episodePoster || historyItem.poster_path || fullContent?.poster_path,
                        backdrop_path: fullContent?.backdrop_path || historyItem.poster_path,
                        
                        // Type & Logic
                        type: historyItem.onModel || fullContent?.type || "Movie",
                        season: historyItem.season,
                        episode: historyItem.episode,
                        episodeTitle: historyItem.episodeTitle,
                        
                        // Merge in full details (seasons array, overview) ONLY if found
                        ...(fullContent || {}), 

                        // Display Subtitle for the Card
                        displaySubtitle: historyItem.season 
                            ? `S${historyItem.season} E${historyItem.episode}` 
                            : "Resume"
                    };
                })
                .filter(Boolean); // Remove nulls from duplicate check

            setHistory(uniqueHistory);
        }

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
        
        {/* ✅ Continue Watching Row */}
        {history.length > 0 && (
            <Row title="Continue Watching" data={history} onMovieClick={onMovieClick} />
        )}

        {/* Categories from Backend */}
        {sections.map((section, index) => (
          <Row key={index} title={section.title} data={section.data} onMovieClick={onMovieClick} />
        ))}
      </div>
    </div>
  );
}