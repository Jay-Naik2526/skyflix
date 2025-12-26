import { useState, useEffect } from "react";
import { Dialog, DialogPanel, DialogBackdrop } from "@headlessui/react";
import { X, Play, Star, Calendar, Download, ImageIcon, ChevronDown } from "lucide-react";
import { useNavigate } from "react-router-dom";

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

const getImageUrl = (path: string | undefined, quality: 'w500' | 'original' = 'w500') => {
  if (!path) return undefined; 
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
  const [selectedSeasonIndex, setSelectedSeasonIndex] = useState(0);

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

  const sortedSeasons = isSeries && movie.seasons ? [...movie.seasons]
    .sort((a: any, b: any) => a.season_number - b.season_number) : [];

  // --- AD LOGIC ---
  const checkAdAndProceed = (adKey: string, callback: () => void) => {
    if (!sessionStorage.getItem(adKey)) {
      window.open(AD_URL, "_blank");
      sessionStorage.setItem(adKey, "true");
      return; 
    }
    callback();
  };

  const handlePlayMain = () => {
    if (isSeries) {
      const firstSeason = sortedSeasons[0];
      if (firstSeason && firstSeason.episodes?.length > 0) {
        const firstEp = [...firstSeason.episodes].sort((a:any, b:any) => a.episode_number - b.episode_number)[0];
        
        const adKey = `ad_view_${movie._id}_S${firstSeason.season_number}_E${firstEp.episode_number}`;
        checkAdAndProceed(adKey, () => {
            // ✅ FIX: Inject season_number explicitly
            navigate("/watch", { 
              state: { 
                movie: { ...firstEp, season_number: firstSeason.season_number }, 
                parentPoster: movie.backdrop_path, 
                seriesData: movie 
              } 
            });
            onClose();
        });
      } else {
        alert("No episodes available.");
      }
    } else {
      const adKey = `ad_view_${movie._id}`;
      checkAdAndProceed(adKey, () => {
          navigate("/watch", { state: { movie: movie } });
          onClose();
      });
    }
  };

  const handleEpisodeClick = (ep: any) => {
    const seasonNum = sortedSeasons[selectedSeasonIndex]?.season_number || 1;
    const adKey = `ad_view_${movie._id}_S${seasonNum}_E${ep.episode_number}`;
    
    checkAdAndProceed(adKey, () => {
        // ✅ FIX: Inject season_number explicitly
        navigate("/watch", { 
          state: { 
            movie: { ...ep, season_number: seasonNum }, 
            parentPoster: movie.backdrop_path, 
            seriesData: movie 
          } 
        });
        onClose();
    });
  };

  const handleDownloadMain = () => {
    const downloadItem = isSeries && sortedSeasons[0]?.episodes?.length > 0 ? sortedSeasons[0].episodes[0] : movie;
    navigate("/download", { state: { movie: downloadItem } });
    onClose();
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-[100]">
      <DialogBackdrop transition className="fixed inset-0 bg-black/90 backdrop-blur-sm transition duration-300 data-[closed]:opacity-0" />
      <div className="fixed inset-0 flex items-end md:items-center justify-center p-0 md:p-4">
        <DialogPanel transition className="w-full bg-[#16181f] shadow-2xl border-t border-white/10 flex flex-col md:flex-row overflow-hidden transition duration-300 data-[closed]:translate-y-full md:data-[closed]:translate-y-0 md:data-[closed]:opacity-0 fixed bottom-0 h-[85vh] rounded-t-3xl md:relative md:bottom-auto md:h-[85vh] md:max-w-6xl md:rounded-2xl md:border">
            
            {/* Poster Side */}
            <div className="hidden md:block w-[350px] relative flex-shrink-0 bg-black">
              {posterUrl ? (
                <img src={posterUrl} alt={displayTitle} className="w-full h-full object-cover opacity-90" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-900 text-gray-700"><ImageIcon size={64} /></div>
              )}
              <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent" />
            </div>

            {/* Content Area */}
            <div className="flex-1 flex flex-col h-full overflow-hidden">
              <div className="md:hidden w-full flex justify-center pt-3 pb-1">
                <div className="w-12 h-1.5 bg-gray-700 rounded-full" />
              </div>

              <div className="flex-1 p-6 md:p-8 overflow-y-auto custom-scrollbar relative">
                <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors z-50">
                    <X size={20} />
                </button>

                <h2 className="text-2xl md:text-4xl font-black italic uppercase tracking-tighter text-white mb-3 leading-tight pr-8">
                    {displayTitle}
                </h2>
                
                <div className="flex flex-wrap items-center gap-3 text-xs md:text-sm text-gray-400 font-bold mb-6">
                    <span className="flex items-center gap-1 text-yellow-400"><Star size={14} fill="currentColor" /> {movie.vote_average?.toFixed(1)}</span>
                    <span className="flex items-center gap-1"><Calendar size={14} /> {new Date(movie.release_date || movie.first_air_date || movie.createdAt).getFullYear()}</span>
                    <span className="px-2 py-0.5 border border-white/20 rounded text-[10px] uppercase text-white tracking-wider">{isSeries ? "Series" : "Movie"}</span>
                </div>

                <div className="flex flex-col md:flex-row gap-3 mb-8">
                    <button onClick={handlePlayMain} className="flex items-center justify-center gap-2 px-6 py-3.5 bg-white text-black font-bold rounded-xl hover:bg-gray-200 transition-colors w-full md:w-auto">
                        <Play fill="black" size={18} /> {playButtonLabel}
                    </button>
                    <button onClick={handleDownloadMain} className="flex items-center justify-center gap-2 px-6 py-3.5 bg-white/10 text-white font-bold rounded-xl hover:bg-white/20 border border-white/10 transition-colors w-full md:w-auto">
                        <Download size={18} /> Download
                    </button>
                </div>

                <p className="text-gray-300 leading-relaxed text-sm md:text-lg mb-8 line-clamp-6 md:line-clamp-none">
                    {movie.overview}
                </p>

                {isSeries && sortedSeasons.length > 0 && (
                  <div className="space-y-4 mt-8 border-t border-white/10 pt-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-bold text-white">Episodes</h3>
                      <div className="relative">
                        <select
                          value={selectedSeasonIndex}
                          onChange={(e) => setSelectedSeasonIndex(Number(e.target.value))}
                          className="appearance-none bg-[#0f1014] border border-white/10 rounded-lg pl-3 pr-8 py-1.5 text-xs text-white font-semibold focus:outline-none focus:border-blue-500 cursor-pointer"
                        >
                          {sortedSeasons.map((season, index) => (
                            <option key={season.season_number} value={index}>
                              Season {season.season_number}
                            </option>
                          ))}
                        </select>
                        <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                      </div>
                    </div>

                    <div className="grid gap-3 pb-10">
                      {sortedSeasons[selectedSeasonIndex]?.episodes
                        ?.sort((a: any, b: any) => a.episode_number - b.episode_number)
                        .map((ep: any) => {
                          const stillUrl = getImageUrl(ep.still_path, 'w500');
                          return (
                            <div key={ep.episode_number} className="group flex gap-3 p-2 bg-white/5 rounded-lg hover:bg-white/10 transition-all active:scale-[0.98]">
                              <div 
                                  className="w-28 h-16 bg-black/50 rounded flex-shrink-0 overflow-hidden relative cursor-pointer"
                                  onClick={() => handleEpisodeClick(ep)}
                              >
                                  {stillUrl ? (
                                      <img src={stillUrl} alt={ep.name} className="w-full h-full object-cover opacity-80" />
                                  ) : (
                                      <div className="w-full h-full flex items-center justify-center text-gray-600"><ImageIcon size={16} /></div>
                                  )}
                                  <div className="absolute inset-0 flex items-center justify-center">
                                      <div className="w-6 h-6 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center">
                                          <Play size={8} fill="white" className="text-white ml-0.5" />
                                      </div>
                                  </div>
                              </div>

                              <div 
                                  className="flex-1 min-w-0 flex flex-col justify-center cursor-pointer"
                                  onClick={() => handleEpisodeClick(ep)}
                              >
                                  <h5 className="text-white font-bold text-xs md:text-sm truncate">
                                      {ep.episode_number}. {ep.name || `Episode ${ep.episode_number}`}
                                  </h5>
                                  <p className="text-[10px] text-gray-500 mt-1 line-clamp-1">
                                      {ep.overview ? ep.overview : "Click to play..."}
                                  </p>
                              </div>

                              <div className="flex flex-col justify-center pl-2">
                                  <button 
                                      onClick={() => { navigate("/download", { state: { movie: ep } }); onClose(); }} 
                                      className="p-2 text-gray-400 hover:text-white rounded-full bg-white/5"
                                  >
                                      <Download size={14} />
                                  </button>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                )}
              </div>
            </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}