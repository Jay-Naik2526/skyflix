import { useEffect, useState } from "react";
import axios from "axios";
import { useOutletContext } from "react-router-dom";
import HeroBanner from "../components/HeroBanner"; 
import Row from "../components/Row";

// Helper for cleaning titles (Instant visual fix)
const cleanTitle = (title: string) => {
  if (!title) return "";
  return title.replace(/\{.*?\}/g, "").replace(/(\.| )?(mkv|mp4|avi)/gi, "").trim();
};

export default function Home() {
  const [content, setContent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { onMovieClick } = useOutletContext<any>(); // Hook for opening modal

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
        const res = await axios.get(`${API_URL}/api/content/home`);
        setContent(res.data);
      } catch (error) {
        console.error("Error fetching home content:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchContent();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0b0f] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!content) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        No content available. Please sync via Admin Panel.
      </div>
    );
  }

  // Fallback hero if featured is missing
  const heroMovie = content.featured || content.latestMovies?.[0] || content.latestSeries?.[0];

  return (
    <div className="min-h-screen bg-[#0a0b0f] pb-20">
      {heroMovie && <HeroBanner movie={heroMovie} />}

      <div className="relative z-20 -mt-32 pl-4 md:pl-12 flex flex-col gap-12">
        {content.trending?.length > 0 && <Row title="Trending Now" data={content.trending} onMovieClick={onMovieClick} />}
        {content.latestMovies?.length > 0 && <Row title="Latest Movies" data={content.latestMovies} onMovieClick={onMovieClick} />}
        {content.latestSeries?.length > 0 && <Row title="Latest Series" data={content.latestSeries} onMovieClick={onMovieClick} />}
      </div>
    </div>
  );
}