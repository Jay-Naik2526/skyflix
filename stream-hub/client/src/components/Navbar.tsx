import { Home, Search, Tv, Film, LayoutGrid, Play, MessageCircleQuestion } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useState } from "react";
import RequestModal from "./RequestModal"; // ✅ Import the modal

export default function Navbar() {
  const location = useLocation();
  const [isRequestOpen, setIsRequestOpen] = useState(false); // ✅ Manage state locally

  const links = [
    { name: "Home", icon: Home, path: "/" },
    { name: "Search", icon: Search, path: "/search" },
    { name: "Series", icon: Tv, path: "/tv" },
    { name: "Movies", icon: Film, path: "/movies" },
    { name: "Categories", icon: LayoutGrid, path: "/categories" },
  ];

  return (
    <>
      <nav className="hidden md:flex flex-col fixed left-0 top-0 h-full w-24 bg-[#0f1014] border-r border-white/5 z-50 py-8 items-center">
        
        {/* SkyFlix Logo */}
        <div className="mb-16">
          <Link to="/" className="flex flex-col items-center justify-center gap-1 group">
            <div className="w-12 h-12 bg-gradient-to-br from-sky-400 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-sky-900/20 group-hover:scale-110 transition-transform duration-300">
              <Play fill="white" size={20} className="text-white ml-1" />
            </div>
            <span className="text-[10px] font-black tracking-[0.2em] text-gray-400 group-hover:text-white transition-colors uppercase">
              SKY
            </span>
          </Link>
        </div>

        {/* Nav Links */}
        <div className="flex flex-col gap-10 w-full">
          {links.map((link) => {
            const isActive = location.pathname === link.path;
            return (
              <Link 
                key={link.name} 
                to={link.path} 
                className={`relative flex flex-col items-center justify-center w-full transition-all duration-300 group ${isActive ? "text-white" : "text-gray-500 hover:text-white"}`}
              >
                {isActive && (
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-sky-500 rounded-l-full shadow-[0_0_15px_rgba(14,165,233,0.6)]" />
                )}
                
                <link.icon 
                  size={28} 
                  className={`transition-transform duration-300 ${isActive ? "scale-110 drop-shadow-md text-sky-100" : "group-hover:scale-110"}`} 
                  strokeWidth={isActive ? 2.5 : 2}
                />

                <span className="absolute left-[70px] bg-white text-black text-sm font-bold px-3 py-1.5 rounded-md opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-[-10px] group-hover:translate-x-0 shadow-lg pointer-events-none z-50 whitespace-nowrap">
                  {link.name}
                  <span className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 bg-white rotate-45"></span>
                </span>
              </Link>
            );
          })}

          {/* ✅ NEW: REQUEST BUTTON (Styled to fit the sidebar) */}
          <button 
            onClick={() => setIsRequestOpen(true)}
            className="relative flex flex-col items-center justify-center w-full transition-all duration-300 group text-gray-500 hover:text-white mt-4"
          >
            <MessageCircleQuestion 
              size={28} 
              className="group-hover:scale-110 transition-transform duration-300 text-sky-400" 
              strokeWidth={2}
            />

            <span className="absolute left-[70px] bg-white text-black text-sm font-bold px-3 py-1.5 rounded-md opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-[-10px] group-hover:translate-x-0 shadow-lg pointer-events-none z-50 whitespace-nowrap">
              Request Movie
              <span className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 bg-white rotate-45"></span>
            </span>
          </button>

        </div>
      </nav>

      {/* ✅ Render Modal here so it works on ALL pages */}
      <RequestModal isOpen={isRequestOpen} onClose={() => setIsRequestOpen(false)} />
    </>
  );
}