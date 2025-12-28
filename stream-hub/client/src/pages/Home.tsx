import { useState, useEffect } from "react";
import { fetchHomeContent, getMe } from "../services/api"; 
import HeroBanner from "../components/HeroBanner";
import Row from "../components/Row";
import { useOutletContext } from "react-router-dom";

// ❌ REMOVED: Unused GENRE_MAP constant

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

        // 3. Process Watch History
        if (userData && userData.watchHistory && userData.watchHistory.length > 0) {
            const seenIds = new Set();
            
            // Flatten the sections to search for matches efficiently
            const allAvailableContent = homeRes?.sections?.flatMap((s: any) => s.data) || [];

            const uniqueHistory = userData.watchHistory
                .map((historyItem: any) => {
                    const idStr = historyItem.contentId.toString();
                    if (seenIds.has(idStr)) return null;
                    seenIds.add(idStr);

                    // Try to find the full object in the currently loaded content
                    const fullContent = allAvailableContent.find((c: any) => c._id === idStr || c.id === idStr);

                    // Merge saved history with whatever we found (or empty object)
                    return {
                        // 1. Start with what we saved in DB
                        ...historyItem, 
                        
                        // 2. Add full details if found
                        ...(fullContent || {}),

                        // 3. Ensure IDs and Type are correct
                        _id: historyItem.contentId,
                        id: historyItem.contentId,
                        type: historyItem.onModel || fullContent?.type || "Movie",
                        
                        // 4. Fallback logic for Poster
                        poster_path: historyItem.episodePoster || historyItem.poster_path || fullContent?.poster_path,
                        
                        // 5. Build Subtitle
                        displaySubtitle: historyItem.season 
                            ? `S${historyItem.season} E${historyItem.episode}` 
                            : "Resume"
                    };
                })
                .filter(Boolean);

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
        
        {/* Continue Watching Row */}
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