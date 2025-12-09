import { Download as DownloadIcon, ShieldCheck, FileVideo, ArrowLeft } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";

export default function Download() {
  const location = useLocation();
  const navigate = useNavigate();
  const movie = location.state?.movie;

  useEffect(() => {
    // If someone tries to access this page directly without clicking a movie, send them home
    if (!movie) {
      navigate("/");
    }
  }, [movie, navigate]);

  if (!movie) return null;

  const handleDownload = () => {
    if (movie.downloadLink) {
        // Open the RPMShare Download Link
        window.open(movie.downloadLink, "_blank");
    } else {
        alert("Download link not available for this file.");
    }
  };

  const title = movie.title || movie.name || "Unknown File";

  return (
    <div className="min-h-screen bg-[#0f1014] text-white flex items-center justify-center p-4 relative overflow-hidden">
      
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[100px] pointer-events-none" />

      {/* Back Button */}
      <button 
        onClick={() => navigate(-1)}
        className="absolute top-6 left-6 flex items-center gap-2 text-gray-400 hover:text-white transition-colors z-20"
      >
        <ArrowLeft size={20} /> Back
      </button>

      <div className="relative z-10 max-w-md w-full bg-[#16181f] border border-white/10 rounded-2xl p-8 text-center shadow-2xl">
        
        {/* Icon */}
        <div className="w-20 h-20 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <FileVideo size={40} className="text-blue-500" />
        </div>

        <h1 className="text-2xl font-bold mb-2">Ready to Download</h1>
        <p className="text-gray-400 text-sm mb-8 px-4 line-clamp-2">
          You are about to download <br/>
          <span className="text-white font-semibold">{title}</span>
        </p>

        {/* The Big Button */}
        <button 
          onClick={handleDownload}
          className="w-full group relative flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl transition-all shadow-lg hover:shadow-blue-500/25 active:scale-95"
        >
          <DownloadIcon className="group-hover:animate-bounce" />
          <span>Start Download</span>
        </button>

        {/* Trust Badges */}
        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-green-400">
          <ShieldCheck size={14} />
          <span>Secure & Virus Free</span>
        </div>

        {/* Technical Info (Optional) */}
        <div className="mt-6 pt-6 border-t border-white/5 flex justify-between text-[10px] text-gray-600 uppercase tracking-wider">
            <span>Server: SkyFlix</span>
            <span>Fast Speed</span>
        </div>

      </div>
    </div>
  );
}