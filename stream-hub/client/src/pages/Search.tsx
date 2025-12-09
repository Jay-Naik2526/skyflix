import { useState, useEffect } from "react";
import { Search as SearchIcon } from "lucide-react";
import { searchContent, fetchMovies, fetchSeries } from "../services/api";
import ContentGrid from "../components/ContentGrid";
import { useOutletContext } from "react-router-dom";

export default function Search() {
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]); 
  const [topSearches, setTopSearches] = useState<any[]>([]); 
  const { onMovieClick } = useOutletContext<any>();

  // 1. Load "Top Searches" (Random Content)
  useEffect(() => {
    const loadTopSearches = async () => {
      try {
        // Fetch page 1 of movies & series
        const moviesRes = await fetchMovies(1, 20);
        const seriesRes = await fetchSeries(1, 20);
        
        // FIX: Extract the .data array from the response object
        const movies = moviesRes.data || [];
        const series = seriesRes.data || [];
        
        const allContent = [...movies, ...series];

        // Shuffle and pick 10 random items
        if (allContent.length > 0) {
          const shuffled = allContent.sort(() => 0.5 - Math.random());
          setTopSearches(shuffled.slice(0, 10));
        }
      } catch (error) {
        console.error("Failed to load top searches", error);
      }
    };
    loadTopSearches();
  }, []);

  // 2. Handle Live Search
  useEffect(() => {
    if (query.trim().length === 0) {
      setSearchResults([]);
      return;
    }

    const delayDebounce = setTimeout(async () => {
      if (query.length > 0) {
        const data = await searchContent(query);
        setSearchResults(data);
      }
    }, 300); 

    return () => clearTimeout(delayDebounce);
  }, [query]);

  const displayData = query.trim().length > 0 ? searchResults : topSearches;
  const displayTitle = query.trim().length > 0 ? `Results for "${query}"` : "Top Searches";

  return (
    <div className="min-h-screen bg-[#0f1014] text-white pt-24 px-6 pb-20">
      <div className="relative max-w-2xl mx-auto mb-8">
        <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
        <input 
          type="text" 
          placeholder="Search movies, shows, genres..." 
          className="w-full bg-[#16181f] border border-white/10 rounded-lg py-4 pl-12 text-white focus:outline-none focus:border-blue-500 transition-colors"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
        />
      </div>

      <ContentGrid 
        title={displayTitle} 
        data={displayData} 
        onMovieClick={onMovieClick} 
      />
    </div>
  );
}