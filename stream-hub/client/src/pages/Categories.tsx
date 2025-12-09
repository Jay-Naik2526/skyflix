import { useEffect, useState } from "react";
import { fetchMovies, fetchSeries } from "../services/api";
import { useOutletContext } from "react-router-dom";
import { Filter, ChevronDown, Star } from "lucide-react";

// --- TMDB GENRE ID TO NAME TRANSLATOR ---
const GENRE_MAP: Record<string, string> = {
  "28": "Action", "12": "Adventure", "16": "Animation", "35": "Comedy",
  "80": "Crime", "99": "Documentary", "18": "Drama", "10751": "Family",
  "14": "Fantasy", "36": "History", "27": "Horror", "10402": "Music",
  "9648": "Mystery", "10749": "Romance", "878": "Sci-Fi", "10770": "TV Movie",
  "53": "Thriller", "10752": "War", "37": "Western", "10759": "Action & Adventure",
  "10765": "Sci-Fi & Fantasy", "10768": "War & Politics"
};

export default function Categories() {
  const [content, setContent] = useState<any[]>([]);
  const [genres, setGenres] = useState<string[]>([]);
  const [selectedGenre, setSelectedGenre] = useState("All");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { onMovieClick } = useOutletContext<any>();

  useEffect(() => {
    const loadData = async () => {
      // Fetch more items for categories (limit 100 per type for good variety)
      const mRes = await fetchMovies(1, 100);
      const sRes = await fetchSeries(1, 100);
      
      // FIX: Extract .data array
      const m = mRes.data || [];
      const s = sRes.data || [];
      
      const all = [...m, ...s].map((item: any) => ({
        ...item,
        displayGenres: item.genre_ids?.map((id: string) => GENRE_MAP[id] || "Other") || []
      }));

      setContent(all);

      const uniqueGenres = Array.from(new Set(all.flatMap((item: any) => item.displayGenres))).sort();
      const cleanGenres = uniqueGenres.filter(g => g !== "Other" && g);
      setGenres(["All", ...cleanGenres]);
    };
    loadData();
  }, []);

  const filteredContent = selectedGenre === "All" 
    ? content 
    : content.filter((item) => item.displayGenres?.includes(selectedGenre));

  return (
    <div className="flex min-h-screen bg-[#0f1014] text-white pt-20 md:pt-0">
      
      {/* SIDEBAR (Desktop) */}
      <div className="hidden md:block w-64 fixed left-24 top-0 h-full bg-[#16181f] border-r border-white/5 overflow-y-auto pt-28 pb-10 z-40 custom-scrollbar">
        <h2 className="px-6 text-xl font-bold mb-6 flex items-center gap-2 text-blue-400">
          <Filter size={20} />
          <span>Genres</span>
        </h2>
        <div className="flex flex-col">
          {genres.map((genre) => (
            <button
              key={genre}
              onClick={() => { setSelectedGenre(genre); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              className={`text-left px-6 py-3 text-sm font-medium transition-all border-l-2 hover:bg-white/5 ${
                selectedGenre === genre ? "border-blue-500 text-white bg-white/5" : "border-transparent text-gray-400 hover:text-white"
              }`}
            >
              {genre}
            </button>
          ))}
        </div>
      </div>

      {/* MOBILE FILTER */}
      <div className="md:hidden fixed top-16 left-0 w-full z-30 bg-[#0f1014]/95 backdrop-blur-md border-b border-white/10 px-4 py-3">
        <div className="relative">
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="w-full flex items-center justify-between bg-[#16181f] text-white px-4 py-3 rounded-lg border border-white/10 font-bold"
          >
            <span>{selectedGenre}</span>
            <ChevronDown size={20} className={`transition-transform ${isMobileMenuOpen ? "rotate-180" : ""}`} />
          </button>
          {isMobileMenuOpen && (
            <div className="absolute top-full left-0 w-full mt-2 bg-[#16181f] border border-white/10 rounded-lg shadow-2xl max-h-[60vh] overflow-y-auto z-50">
              {genres.map(genre => (
                <button
                  key={genre}
                  onClick={() => { setSelectedGenre(genre); setIsMobileMenuOpen(false); }}
                  className="w-full text-left px-4 py-3 border-b border-white/5 text-gray-300"
                >
                  {genre}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* GRID AREA */}
      <div className="flex-1 md:ml-64 p-6 md:p-12 md:pt-24 min-h-screen">
        <header className="mb-8">
          <h1 className="text-3xl md:text-4xl font-black italic uppercase">
            {selectedGenre} <span className="text-gray-600 text-lg not-italic font-normal normal-case ml-2">({filteredContent.length} titles)</span>
          </h1>
        </header>

        {filteredContent.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6 pb-20">
            {filteredContent.map((item) => (
              <div 
                key={item._id || item.id} 
                onClick={() => onMovieClick(item)}
                className="relative group cursor-pointer aspect-[2/3] rounded-xl overflow-hidden bg-[#16181f] shadow-lg border border-white/5 hover:scale-[1.02] transition-transform"
              >
                <img 
                  src={item.poster_path} 
                  alt={item.title} 
                  className="w-full h-full object-cover opacity-90 group-hover:opacity-100"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-4 flex flex-col justify-end">
                  <h3 className="font-bold text-white text-sm mb-1 line-clamp-2">{item.title || item.name}</h3>
                  <div className="flex items-center justify-between text-xs text-gray-300">
                    <span>{new Date(item.createdAt).getFullYear()}</span>
                    <span className="text-yellow-400 font-bold flex items-center gap-1"><Star size={10} fill="currentColor"/> {item.vote_average?.toFixed(1)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="h-64 flex items-center justify-center text-gray-500">No content found.</div>
        )}
      </div>
    </div>
  );
}