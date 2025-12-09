import { useState, useEffect } from "react";
import axios from "axios";
import { fetchMovies, fetchSeries } from "../services/api";
import HeroBanner from "../components/HeroBanner";
import Row from "../components/Row";

// ✅ FIXED: Removed unused 'cleanTitle' function

interface HomeProps {
  onMovieClick: (movie: any) => void;
}

export default function Home({ onMovieClick }: HomeProps) {
  const [movies, setMovies] = useState<any[]>([]);
  const [series, setSeries] = useState<any[]>([]);
  const [heroMovies, setHeroMovies] = useState<any[]>([]); // ✅ Stores the LIST

  useEffect(() => {
    // Helper: Random Fallback
    const pickRandom = (allContent: any[]) => {
      if (allContent && allContent.length > 0) {
        const shuffled = [...allContent].sort(() => 0.5 - Math.random());
        setHeroMovies(shuffled.slice(0, 5));
      }
    };

    const loadContent = async () => {
      try {
        const movieData = await fetchMovies() || [];
        const seriesData = await fetchSeries() || [];
        
        const mList = movieData.data || movieData;
        const sList = seriesData.data || seriesData;

        setMovies(mList);
        setSeries(sList);
        const allContent = [...mList, ...sList];

        // LOAD ADMIN CONFIG
        try {
          const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";
          const configRes = await axios.get(`${API_BASE}/api/admin/homepage`);
          const adminPicks = configRes.data?.bannerItems || [];

          if (adminPicks.length > 0) {
            const validPicks = adminPicks
              .map((item: any) => item.contentId)
              .filter((content: any) => content && (content.title || content.name));
            
            if (validPicks.length > 0) {
                setHeroMovies(validPicks);
            } else {
                pickRandom(allContent);
            }
          } else {
            pickRandom(allContent);
          }
        } catch (configErr) {
          pickRandom(allContent);
        }

      } catch (error) {
        console.error("Critical Error:", error);
      }
    };

    loadContent();
  }, []);

  return (
    <div className="min-h-screen bg-[#0f1014] text-white overflow-x-hidden pb-20">
      
      {/* ✅ FIXED: Passing 'movies' (plural) to match HeroBanner */}
      {heroMovies.length > 0 && <HeroBanner movies={heroMovies} />}
      
      <div className="relative z-10 -mt-16 md:-mt-10 space-y-8">
        {movies.length > 0 && <Row title="Latest Movies" data={movies} isVertical={true} onMovieClick={onMovieClick} />}
        {series.length > 0 && <Row title="Latest Series" data={series} onMovieClick={onMovieClick} />}
      </div>
    </div>
  );
}