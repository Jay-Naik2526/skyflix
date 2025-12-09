import { Play, Search } from "lucide-react";
import { Link } from "react-router-dom";

export default function MobileTopBar() {
  return (
    <div className="md:hidden fixed top-0 left-0 w-full z-40 bg-[#0f1014]/80 backdrop-blur-md border-b border-white/5 px-6 py-4 flex items-center justify-between">
       
       {/* Brand Logo */}
       <Link to="/" className="flex items-center gap-3">
          {/* Small Icon */}
          <div className="w-8 h-8 bg-gradient-to-br from-sky-400 to-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-sky-900/20">
            <Play fill="white" size={12} className="text-white ml-0.5" />
          </div>
          
          {/* Full Name Text */}
          <h1 className="text-xl font-black italic tracking-tighter text-white">
            SKY<span className="text-sky-500">FLIX</span>
          </h1>
       </Link>

       {/* Quick Search Icon */}
       <Link to="/search" className="p-2 bg-white/5 rounded-full text-gray-300 hover:text-white hover:bg-white/10 transition-colors">
          <Search size={20} />
       </Link>
    </div>
  );
}