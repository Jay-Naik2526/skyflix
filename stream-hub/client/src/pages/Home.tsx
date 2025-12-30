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

  // This handles opening the Detail Modal (Passed from App.tsx)
  const context = useOutletContext<any>();
  const onMovieClick = context?.onMovieClick || (() => {});

  useEffect(() => {
    const loadContent = async () => {
      setLoading(true);
      try {
        // 1. Fetch Homepage Data & User Data in parallel (Restored your old logic)
        const [homeRes, userData] = await Promise.all([
          fetchHomeContent(),
          getMe().catch(() => null) // Fail silently if not logged in
        ]);

        // 2. Set Banner & Sections from Backend
        if (homeRes) {
            setHeroMovies(homeRes.banner || []);
            setSections(homeRes.sections || []);
        }

        // 3. Process Watch History (The Fix)
        if (userData && userData.watchHistory && userData.watchHistory.length > 0) {
            const seenIds = new Set();
            
            // Flatten sections to find matches (Movies/Series currently on home)
            const allAvailableContent = homeRes?.sections?.flatMap((s: any) => s.data) || [];

            const uniqueHistory = userData.watchHistory
                .map((historyItem: any) => {
                    // ✅ FIX: Ensure ID is a clean string
                    const idStr = String(historyItem.contentId);
                    
                    if (seenIds.has(idStr)) return null;
                    seenIds.add(idStr);

                    // Find full details if available (Contains seasons, backdrop, etc.)
                    const fullContent = allAvailableContent.find((c: any) => String(c._id) === idStr || String(c.id) === idStr);

                    // ✅ FIX: Determine Type correctly (Handle "series" vs "Series")
                    const rawType = historyItem.onModel || fullContent?.type || "Movie";
                    const safeType = rawType.toLowerCase() === "series" ? "Series" : "Movie";

                    // Merge Data
                    return {
                        // 1. Start with saved history
                        ...historyItem, 
                        
                        // 2. Add full details (Crucial for Seasons/Backdrop)
                        ...(fullContent || {}),

                        // 3. Enforce correct IDs
                        _id: idStr,
                        id: idStr,
                        type: safeType,
                        
                        // 4. Smart Poster Logic
                        // Shows Episode Still if available, otherwise Series/Movie Poster
                        poster_path: historyItem.episodePoster || fullContent?.poster_path || historyItem.poster_path,
                        
                        // 5. Display Subtitle (e.g. "S1 E5")
                        displaySubtitle: historyItem.season 
                            ? `S${historyItem.season} E${historyItem.episode}` 
                            : "Resume"
                    };
                })
                .filter(Boolean); // Remove nulls

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