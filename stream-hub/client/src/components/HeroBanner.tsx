import { Play, Info, ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DetailModal from "./DetailModal";

const cleanTitle = (title: string) => {
  if (!title) return "";
  return title
    .replace(/\{.*?\}/g, "")
    .replace(/(\.| )?(mkv|mp4|avi)/gi, "")
    .replace(/\s\((19|20)\d{2}\)$/, "")
    .replace(/[\.\-\_]/g, " ")
    .trim();
};

const getImageUrl = (path: string) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return `https://image.tmdb.org/t/p/original${path}`;
}

// ✅ CHANGED: Now accepts an ARRAY of movies
export default function HeroBanner({ movies }: { movies: any[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();

  // Reset to 0 when the list changes
  useEffect(() => {
    setCurrentIndex(0);
  }, [movies]);

  // ✅ AUTO-LOOP LOGIC (5 Seconds)
  useEffect(() => {
    if (!movies || movies.length <= 1) return;
    
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % movies.length);
    }, 5000); // Change slide every 5 seconds

    return () => clearInterval(timer);
  }, [movies]);

  // Manual Navigation
  const nextSlide = () => setCurrentIndex((prev) => (prev + 1) % movies.length);
  const prevSlide = () => setCurrentIndex((prev) => (prev - 1 + movies.length) % movies.length);

  // Safety Check
  if (!movies || movies.length === 0) return null;

  const movie = movies[currentIndex];
  const displayTitle = cleanTitle(movie.title || movie.name);
  const isSeries = movie.type === "Series" || (movie.seasons && movie.seasons.length > 0);
  const backdropUrl = getImageUrl(movie.backdrop_path);

  const handlePlay = () => {
    if (isSeries) {
      const seasons = movie.seasons || [];
      const firstSeason = seasons.sort((a: any, b: any) => a.season_number - b.season_number)[0];
      if (firstSeason && firstSeason.episodes?.length > 0) {
        const firstEp = firstSeason.episodes.sort((a:any, b:any) => a.episode_number - b.episode_number)[0];
        navigate("/watch", { state: { movie: firstEp, parentPoster: movie.backdrop_path } });
      } else {
        setIsModalOpen(true);
      }
    } else {
      navigate("/watch", { state: { movie: movie } });
    }
  };

  return (
    <div className="relative h-[85vh] w-full flex items-center mb-12 group">
      
      {/* BACKGROUND IMAGE (With Fade Key) */}
      <div className="absolute inset-0">
        {backdropUrl ? (
          <img 
            key={movie._id} // ✅ KEY IS CRITICAL FOR FADE TRANSITION
            src={backdropUrl} 
            alt={displayTitle} 
            className="w-full h-full object-cover animate-fade-in transition-opacity duration-1000"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gray-900 via-blue-950 to-black" />
        )}
        {/* Gradients */}
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/50 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0f1014] via-transparent to-transparent" />
      </div>

      {/* CONTENT */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 md:px-12 pt-20">
        {/* Title with Fade Animation */}
        <h1 key={displayTitle} className="text-4xl md:text-7xl font-black italic uppercase text-white max-w-2xl mb-4 drop-shadow-2xl leading-tight animate-fade-in">
          {displayTitle}
        </h1>

        <div className="flex items-center gap-4 text-sm font-bold text-gray-300 mb-6 animate-fade-in">
          <span className="text-green-400">Featured</span>
          <span>{new Date(movie.release_date || movie.first_air_date || Date.now()).getFullYear()}</span>
          <span className="px-2 py-0.5 border border-white/30 rounded text-xs uppercase">HD</span>
          {isSeries && <span className="text-blue-400">SERIES</span>}
        </div>

        <p key={movie.overview} className="text-gray-300 text-lg max-w-xl mb-8 line-clamp-3 animate-fade-in">
          {movie.overview === "Syncing metadata..." ? "Fetching details..." : movie.overview}
        </p>

        <div className="flex gap-4 animate-fade-in">
          <button onClick={handlePlay} className="flex items-center gap-2 px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg transition-transform hover:scale-105">
            <Play fill="currentColor" size={20} /> {isSeries ? "Play Series" : "Watch Now"}
          </button>
          <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 px-8 py-3.5 bg-white/10 hover:bg-white/20 backdrop-blur text-white rounded-xl font-bold border border-white/10 hover:scale-105">
            <Info size={20} /> More Info
          </button>
        </div>
      </div>

      {/* ✅ NAVIGATION BUTTONS (Faded until hover) */}
      {movies.length > 1 && (
        <>
          <button 
            onClick={prevSlide}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-black/20 hover:bg-black/60 rounded-full text-white/50 hover:text-white backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100 hover:scale-110 z-20"
          >
            <ChevronLeft size={40} />
          </button>
          <button 
            onClick={nextSlide}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-black/20 hover:bg-black/60 rounded-full text-white/50 hover:text-white backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100 hover:scale-110 z-20"
          >
            <ChevronRight size={40} />
          </button>
          
          {/* DOT INDICATORS */}
          <div className="absolute bottom-8 right-8 flex gap-2 z-20">
            {movies.map((_, idx) => (
                <div 
                    key={idx} 
                    className={`h-1.5 rounded-full transition-all duration-500 ${idx === currentIndex ? "w-8 bg-blue-500" : "w-2 bg-white/30"}`}
                />
            ))}
          </div>
        </>
      )}

      <DetailModal isOpen={isModalOpen} movie={movie} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}