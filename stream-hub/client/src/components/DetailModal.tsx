import { useState, useEffect } from "react";
import { Dialog, DialogPanel, DialogBackdrop } from "@headlessui/react";
import { X, Play, Star, Calendar, Download, ImageIcon, ChevronDown } from "lucide-react";
import { useNavigate } from "react-router-dom";

// --- CONSISTENT HELPER FUNCTIONS ---

// More robust title cleaning
const cleanTitle = (title: string) => {
  if (!title) return "";
  return title
    .replace(/\{.*?\}/g, "") // Remove ID like {tmdb-123}
    .replace(/(\.| )?(mkv|mp4|avi)/gi, "") // Remove file extension
    .replace(/\s\((19|20)\d{2}\)$/, "") // Remove year like (2023) at the end
    .replace(/[\.\-\_]/g, " ") // Replace separators with spaces
    .trim();
};

// Image URL builder
const getImageUrl = (path: string | undefined, quality: 'w500' | 'original' = 'w500') => {
  if (!path) return undefined; // Return undefined to allow for placeholder rendering
  if (path.startsWith('http')) return path;
  return `https://image.tmdb.org/t/p/${quality}${path}`;
}

interface DetailModalProps {
  isOpen: boolean;
  movie: any;
  onClose: () => void;
}

export default function DetailModal({ isOpen, movie, onClose }: DetailModalProps) {
  const navigate = useNavigate();
  // State for the selected season index
  const [selectedSeasonIndex, setSelectedSeasonIndex] = useState(0);

  // Reset selected season when the modal opens with a new movie
  useEffect(() => {
    if (isOpen) {
      setSelectedSeasonIndex(0);
    }
  }, [isOpen, movie]);

  if (!movie) return null;

  const displayTitle = cleanTitle(movie.title || movie.name);
  const isSeries = movie.type === "Series" || (movie.seasons && movie.seasons.length > 0);
  const playButtonLabel = isSeries ? "Play S1 E1" : "Start Movie";
  const posterUrl = getImageUrl(movie.poster_path, 'w500');

  // Pre-sort seasons for consistent ordering
  const sortedSeasons = isSeries && movie.seasons ? [...movie.seasons]
    .sort((a: any, b: any) => a.season_number - b.season_number) : [];

  const handlePlayMain = () => {
    if (isSeries) {
      const firstSeason = sortedSeasons[0];
      if (firstSeason && firstSeason.episodes?.length > 0) {
        const firstEp = [...firstSeason.episodes].sort((a:any, b:any) => a.episode_number - b.episode_number)[0];
        navigate("/watch", { state: { movie: firstEp, parentPoster: movie.backdrop_path } });
      } else {
        alert("No episodes available.");
      }
    } else {
      navigate("/watch", { state: { movie: movie } });
    }
    onClose();
  };

  const handleDownloadMain = () => {
    // For series, download the first episode by default, or the whole movie
    const downloadItem = isSeries && sortedSeasons[0]?.episodes?.length > 0 ? sortedSeasons[0].episodes[0] : movie;
    navigate("/download", { state: { movie: downloadItem } });
    onClose();
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-[100]">
      
      <DialogBackdrop 
        transition
        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition duration-300 data-[closed]:opacity-0"
      />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel 
          transition
          className="w-full max-w-6xl bg-[#16181f] rounded-2xl overflow-hidden shadow-2xl border border-white/10 flex flex-col md:flex-row max-h-[90vh] transition duration-300 data-[closed]:scale-95 data-[closed]:opacity-0"
        >
            
            <div className="hidden md:block w-[350px] relative flex-shrink-0 bg-black">
              {posterUrl ? (
                <img src={posterUrl} alt={displayTitle} className="w-full h-full object-cover opacity-90" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-900 text-gray-700"><ImageIcon size={64} /></div>
              )}
              <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent" />
            </div>

            <div className="flex-1 p-8 overflow-y-auto custom-scrollbar relative">
              <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors z-50">
                  <X size={24} />
              </button>

              <h2 className="text-4xl font-black italic uppercase tracking-tighter text-white mb-3">{displayTitle}</h2>
              
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400 font-bold mb-6">
                  <span className="flex items-center gap-1 text-yellow-400"><Star size={16} fill="currentColor" /> {movie.vote_average?.toFixed(1)}</span>
                  <span className="flex items-center gap-1"><Calendar size={16} /> {new Date(movie.release_date || movie.first_air_date || movie.createdAt).getFullYear()}</span>
                  <span className="px-2 py-0.5 border border-white/20 rounded text-xs uppercase text-white">{isSeries ? "Series" : "Movie"}</span>
              </div>

              <div className="flex items-center gap-4 mb-8">
                  <button onClick={handlePlayMain} className="flex items-center gap-2 px-8 py-3 bg-white text-black font-bold rounded-lg hover:bg-gray-200 transition-colors">
                      <Play fill="black" size={20} /> {playButtonLabel}
                  </button>
                  <button onClick={handleDownloadMain} className="flex items-center gap-2 px-8 py-3 bg-white/10 text-white font-bold rounded-lg hover:bg-white/20 border border-white/10 transition-colors">
                      <Download size={20} /> Download
                  </button>
              </div>

              <p className="text-gray-300 leading-relaxed text-lg mb-8">{movie.overview}</p>

              {/* --- NEW SERIES EPISODES SECTION WITH DROPDOWN --- */}
              {isSeries && sortedSeasons.length > 0 && (
                <div className="space-y-4 mt-8 border-t border-white/10 pt-8">
                  
                  {/* Season Selector Dropdown */}
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold text-white">Episodes</h3>
                    <div className="relative">
                      <select
                        value={selectedSeasonIndex}
                        onChange={(e) => setSelectedSeasonIndex(Number(e.target.value))}
                        className="appearance-none bg-[#0f1014] border border-white/10 rounded-lg pl-4 pr-10 py-2 text-white font-semibold focus:outline-none focus:border-blue-500 cursor-pointer"
                      >
                        {sortedSeasons.map((season, index) => (
                          <option key={season.season_number} value={index}>
                            Season {season.season_number}
                          </option>
                        ))}
                      </select>
                      <ChevronDown size={20} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>
                  </div>

                  {/* Episode List for Selected Season */}
                  <div className="grid gap-3">
                    {sortedSeasons[selectedSeasonIndex]?.episodes
                      ?.sort((a: any, b: any) => a.episode_number - b.episode_number)
                      .map((ep: any) => {
                        const stillUrl = getImageUrl(ep.still_path, 'w500');
                        return (
                          <div key={ep.episode_number} className="group flex gap-4 p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-all border border-transparent hover:border-white/10">
                            
                            <div 
                                className="w-40 h-24 bg-black/50 rounded-lg flex-shrink-0 overflow-hidden relative cursor-pointer shadow-lg"
                                onClick={() => { navigate("/watch", { state: { movie: ep, parentPoster: movie.backdrop_path } }); onClose(); }}
                            >
                                {stillUrl ? (
                                    <img src={stillUrl} alt={ep.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-600"><ImageIcon size={24} /></div>
                                )}
                                <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-transparent transition-colors">
                                    <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center group-hover:bg-blue-600 transition-colors">
                                        <Play size={12} fill="white" className="text-white" />
                                    </div>
                                </div>
                            </div>

                            <div 
                                className="flex-1 py-1 cursor-pointer min-w-0"
                                onClick={() => { navigate("/watch", { state: { movie: ep, parentPoster: movie.backdrop_path } }); onClose(); }}
                            >
                                <div className="flex justify-between items-start">
                                    <h5 className="text-white font-bold text-sm md:text-base group-hover:text-blue-400 transition-colors truncate pr-2">
                                        {ep.episode_number}. {ep.name || `Episode ${ep.episode_number}`}
                                    </h5>
                                    <span className="text-xs text-gray-500 font-mono whitespace-nowrap hidden md:block">{Math.floor(Math.random() * 20 + 40)}m</span>
                                </div>
                                <p className="text-xs text-gray-400 mt-2 line-clamp-2 leading-relaxed">
                                    {ep.overview || "Plot details coming soon..."}
                                </p>
                            </div>

                            <div className="flex flex-col justify-center border-l border-white/5 pl-4">
                                <button 
                                    onClick={() => { navigate("/download", { state: { movie: ep } }); onClose(); }} 
                                    className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                                    title="Download Episode"
                                >
                                    <Download size={20} />
                                </button>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}

            </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
