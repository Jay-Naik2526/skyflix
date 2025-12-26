import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { X } from "lucide-react";
import { updateWatchHistory } from "../services/api"; 

export default function Watch() {
  const navigate = useNavigate();
  const location = useLocation();
  const movie = location.state?.movie; 
  const seriesData = location.state?.seriesData; 

  useEffect(() => {
    if (!movie) {
      navigate("/");
      return;
    }

    // 🌟 HEARTBEAT: Save History every 60 seconds
    const saveProgress = () => {
        const isSeries = !!seriesData;
        
        // If it's a series, we link to the Main Series ID, but save season/ep info
        // If it's a movie, we just link to the Movie ID
        const contentId = isSeries ? seriesData._id : movie._id;
        const onModel = isSeries ? "Series" : "Movie";

        updateWatchHistory({
            contentId,
            onModel,
            // ✅ Works now because DetailModal is sending 'season_number'
            season: isSeries ? movie.season_number : undefined,
            episode: isSeries ? movie.episode_number : undefined,
            progress: 0, 
            duration: 0
        });
    };

    // 1. Save immediately when opening
    saveProgress();

    // 2. Save every minute (so it stays fresh in "Continue Watching")
    const interval = setInterval(saveProgress, 60 * 1000);

    return () => clearInterval(interval);
  }, [movie, seriesData, navigate]);

  if (!movie) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center overflow-y-auto">
      
      <button 
        onClick={() => navigate(-1)} 
        className="absolute top-6 right-6 z-50 p-3 bg-red-600 hover:bg-red-700 rounded-full text-white shadow-lg border border-white/20 transition-transform hover:scale-110"
      >
        <X size={28} />
      </button>

      <div className="w-full md:w-[80%] aspect-video bg-black relative shadow-2xl mt-10">
         {movie.embedCode ? (
           <div 
             className="w-full h-full [&_iframe]:w-full [&_iframe]:h-full [&_iframe]:border-0"
             dangerouslySetInnerHTML={{ __html: movie.embedCode }} 
           />
         ) : (
           <div className="text-white text-center pt-20 flex flex-col gap-2">
             <span className="text-xl font-bold">Error Loading Player</span>
             <span className="text-sm text-gray-500">No embed code found for this item.</span>
             <span className="text-xs text-gray-700 font-mono mt-4">ID: {movie.fileCode || "Unknown"}</span>
           </div>
         )}
      </div>

    </div>
  );
}