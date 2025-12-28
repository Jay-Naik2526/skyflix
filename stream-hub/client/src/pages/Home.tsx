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

  const context = useOutletContext<any>();
  const onMovieClick = context?.onMovieClick || (() => {});

  useEffect(() => {
    const loadContent = async () => {
      setLoading(true);
      try {
        // ✅ 1. Fetch Optimized Home Content + User History
        // We now fetch pre-calculated sections from the server (FAST)
        const [homeRes, userData] = await Promise.all([
          fetchHomeContent(),
          getMe().catch(() => null)
        ]);

        // ✅ 2. Set Banner & Sections
        if (homeRes) {
            setHeroMovies(homeRes.banner || []);
            setSections(homeRes.sections || []);
        }

        // ✅ 3. Process Personal Watch History
        if (userData && userData.watchHistory && userData.watchHistory.length > 0) {
            const seenIds = new Set();
            
            const uniqueHistory = userData.watchHistory
                .filter((item: any) => {
                    const idStr = item.contentId.toString();
                    if (seenIds.has(idStr)) return false;
                    seenIds.add(idStr);
                    return true;
                })
                .map((item: any) => ({
                    ...item,
                    _id: item.contentId, 
                    id: item.contentId,
                    type: item.onModel,
                    season: item.season,
                    episode: item.episode,
                    poster_path: item.episodePoster || item.poster_path,
                    displaySubtitle: item.season ? `S${item.season} E${item.episode}${item.episodeTitle ? `: ${item.episodeTitle}` : ''}` : "Resume"
                }));

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

        {/* Pre-calculated Sections from Backend */}
        {sections.map((section, index) => (
          <Row key={index} title={section.title} data={section.data} onMovieClick={onMovieClick} />
        ))}
      </div>
    </div>
  );
}