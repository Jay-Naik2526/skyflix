import { Play, Info, ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DetailModal from "./DetailModal";

const AD_URL = "https://geneticallydetection.com/z5re0ci0?key=5a2d63984f2aea7c121135c4b7469782";

const cleanTitle = (title: string) => {
  if (!title) return "";
  return title
    .replace(/\{.*?\}/g, "")
    .replace(/(\.| )?(mkv|mp4|avi)/gi, "")
    .replace(/\s\((19|20)\d{2}\)$/, "")
    .replace(/[\.\-\_]/g, " ")
    .trim();
};

const getImageUrl = (path: string | undefined | null) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return `https://image.tmdb.org/t/p/original${path}`;
}

export default function HeroBanner({ movies }: { movies: any[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    setCurrentIndex(0);
  }, [movies]);

  useEffect(() => {
    if (!movies || movies.length <= 1) return;
    if (isModalOpen) return;
    
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % movies.length);
    }, 5000); 

    return () => clearInterval(timer);
  }, [movies, isModalOpen]); 

  const nextSlide = () => setCurrentIndex((prev) => (prev + 1) % movies.length);
  const prevSlide = () => setCurrentIndex((prev) => (prev - 1 + movies.length) % movies.length);

  if (!movies || movies.length === 0) return null;

  const movie = movies[currentIndex] || movies[0];
  if (!movie) return null;

  const displayTitle = cleanTitle(movie.title || movie.name || "Unknown");
  const isSeries = movie.type === "Series" || (movie.seasons && movie.seasons.length > 0);
  
  // ✅ FIX: Use backdrop if available, otherwise force the Poster image so it's never black
  const backdropUrl = getImageUrl(movie.backdrop_path || movie.poster_path);

  const handleOpenModal = () => {
    setSelectedMovie(movie); 
    setIsModalOpen(true);
  };

  const handlePlay = () => {
    let adKey = "";
    if (isSeries) {
      const seasons = movie.seasons || [];
      if (seasons.length > 0) {
        const firstSeason = [...seasons].sort((a: any, b: any) => a.season_number - b.season_number)[0];
        if (firstSeason && firstSeason.episodes?.length > 0) {
          const firstEp = [...firstSeason.episodes].sort((a:any, b:any) => a.episode_number - b.episode_number)[0];
          adKey = `ad_view_${movie._id}_S${firstSeason.season_number}_E${firstEp.episode_number}`;
          if (!sessionStorage.getItem(adKey)) {
            window.open(AD_URL, "_blank");
            sessionStorage.setItem(adKey, "true");
            return; 
          }
          navigate("/watch", { state: { movie: firstEp, parentPoster: movie.backdrop_path } });
          return;
        }
      }
      handleOpenModal();
    } else {
      adKey = `ad_view_${movie._id}`;
      if (!sessionStorage.getItem(adKey)) {
        window.open(AD_URL, "_blank");
        sessionStorage.setItem(adKey, "true");
        return; 
      }
      navigate("/watch", { state: { movie: movie } });
    }
  };

  return (
    <div className="relative h-[60vh] md:h-[85vh] w-full flex items-center mb-4 md:mb-12 group overflow-hidden">
      
      {/* Background Image */}
      <div className="absolute inset-0">
        {backdropUrl ? (
          <img 
            key={movie._id} 
            src={backdropUrl} 
            alt={displayTitle} 
            className="w-full h-full object-cover animate-fade-in transition-opacity duration-1000"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gray-900 via-blue-950 to-black" />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0f1014] via-[#0f1014]/20 to-transparent" />
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-5 md:px-12 pt-16 md:pt-20">
        <h1 key={displayTitle} className="text-3xl md:text-7xl font-black italic uppercase text-white max-w-3xl mb-2 md:mb-4 drop-shadow-2xl leading-tight animate-fade-in line-clamp-2">
          {displayTitle}
        </h1>

        <div className="flex items-center gap-3 text-xs md:text-sm font-bold text-gray-300 mb-4 md:mb-6 animate-fade-in">
          <span className="text-green-400">Featured</span>
          <span>{new Date(movie.release_date || movie.first_air_date || Date.now()).getFullYear()}</span>
          <span className="px-1.5 py-0.5 border border-white/30 rounded text-[10px] uppercase">HD</span>
          {isSeries && <span className="text-blue-400">SERIES</span>}
        </div>

        <p key={movie.overview} className="text-gray-300 text-xs md:text-lg max-w-xl mb-6 md:mb-8 line-clamp-3 animate-fade-in pr-4 hidden md:block">
          {movie.overview === "Syncing metadata..." ? "Fetching details..." : movie.overview}
        </p>

        <div className="flex flex-col md:flex-row gap-3 md:gap-4 animate-fade-in w-full md:w-auto">
          <button onClick={handlePlay} className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg transition-transform hover:scale-105 w-full md:w-auto text-sm md:text-base">
            <Play fill="currentColor" size={16} /> {isSeries ? "Play Series" : "Watch Now"}
          </button>
          
          <button onClick={handleOpenModal} className="flex items-center justify-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 backdrop-blur text-white rounded-xl font-bold border border-white/10 hover:scale-105 w-full md:w-auto text-sm md:text-base">
            <Info size={16} /> More Info
          </button>
        </div>
      </div>

      {/* Navigation Arrows */}
      {movies.length > 1 && (
        <>
          <button onClick={prevSlide} className="hidden md:block absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-black/20 hover:bg-black/60 rounded-full text-white/50 hover:text-white backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100 z-20"><ChevronLeft size={32} /></button>
          <button onClick={nextSlide} className="hidden md:block absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-black/20 hover:bg-black/60 rounded-full text-white/50 hover:text-white backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100 z-20"><ChevronRight size={32} /></button>
          <div className="absolute bottom-6 right-6 flex gap-2 z-20 hidden md:flex">
            {movies.map((_, idx) => (
                <div key={idx} className={`h-1.5 rounded-full transition-all duration-500 ${idx === currentIndex ? "w-8 bg-blue-500" : "w-2 bg-white/30"}`} />
            ))}
          </div>
        </>
      )}

      {selectedMovie && <DetailModal isOpen={isModalOpen} movie={selectedMovie} onClose={() => { setIsModalOpen(false); setSelectedMovie(null); }} />}
    </div>
  );
}