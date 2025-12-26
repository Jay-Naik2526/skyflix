import { Home, Search, Tv, Film, LayoutGrid, Play, MessageCircleQuestion, LogIn} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import RequestModal from "./RequestModal";
import { getMe, logoutUser } from "../services/api"; // Import Auth API

export default function Navbar() {
  const location = useLocation();
  const [isRequestOpen, setIsRequestOpen] = useState(false);
  const [user, setUser] = useState<any>(null); // Store User State

  // Check Login Status on Mount
  useEffect(() => {
    const checkUser = async () => {
      try {
        const userData = await getMe();
        setUser(userData);
      } catch (error) {
        setUser(null);
      }
    };
    checkUser();
  }, []);

  const handleLogout = async () => {
    await logoutUser();
    window.location.reload();
  };

  const links = [
    { name: "Home", icon: Home, path: "/" },
    { name: "Search", icon: Search, path: "/search" },
    { name: "Series", icon: Tv, path: "/tv" },
    { name: "Movies", icon: Film, path: "/movies" },
    { name: "Categories", icon: LayoutGrid, path: "/categories" },
  ];

  return (
    <>
      <nav className="hidden md:flex flex-col fixed left-0 top-0 h-full w-24 bg-[#0f1014] border-r border-white/5 z-50 py-8 items-center justify-between">
        
        {/* 1. TOP SECTION: LOGO & LINKS */}
        <div className="flex flex-col items-center w-full">
            {/* SkyFlix Logo */}
            <div className="mb-16">
            <Link to="/" className="flex flex-col items-center justify-center gap-1 group">
                <div className="w-12 h-12 bg-gradient-to-br from-sky-400 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-sky-900/20 group-hover:scale-110 transition-transform duration-300">
                <Play fill="white" className="text-white ml-1" size={20} />
                </div>
            </Link>
            </div>

            {/* Navigation Links */}
            <div className="flex flex-col gap-8 w-full items-center">
            {links.map((link) => {
                const isActive = location.pathname === link.path;
                return (
                <Link 
                    key={link.name} 
                    to={link.path}
                    className={`relative flex flex-col items-center justify-center w-full transition-all duration-300 group ${isActive ? "text-sky-400" : "text-gray-500 hover:text-white"}`}
                >
                    {/* Active Indicator Line */}
                    {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-sky-500 rounded-r-full shadow-[0_0_15px_rgba(14,165,233,0.5)]"></div>
                    )}

                    <link.icon 
                    size={24} 
                    className={`group-hover:scale-110 transition-transform duration-300 ${isActive ? "drop-shadow-[0_0_8px_rgba(14,165,233,0.5)]" : ""}`} 
                    strokeWidth={isActive ? 2.5 : 2}
                    />

                    {/* Hover Tooltip */}
                    <span className="absolute left-[70px] bg-white text-black text-sm font-bold px-3 py-1.5 rounded-md opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-[-10px] group-hover:translate-x-0 shadow-lg pointer-events-none z-50 whitespace-nowrap">
                    {link.name}
                    <span className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 bg-white rotate-45"></span>
                    </span>
                </Link>
                );
            })}

            {/* Request Button */}
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
        </div>

        {/* 2. BOTTOM SECTION: AUTH (LOGIN / AVATAR) */}
        <div className="flex flex-col items-center gap-6 mb-4">
            {user ? (
                // LOGGED IN: Show Avatar
                <button 
                    onClick={handleLogout}
                    className="relative group"
                >
                    <img 
                        src={user.avatar || "https://upload.wikimedia.org/wikipedia/commons/0/0b/Netflix-avatar.png"} 
                        alt="User"
                        className="w-10 h-10 rounded-full border-2 border-transparent group-hover:border-red-500 transition-all object-cover"
                    />
                     {/* Logout Tooltip */}
                     <span className="absolute left-[70px] bg-red-600 text-white text-sm font-bold px-3 py-1.5 rounded-md opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-[-10px] group-hover:translate-x-0 shadow-lg pointer-events-none z-50 whitespace-nowrap top-1/2 -translate-y-1/2">
                        Logout
                        <span className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 bg-red-600 rotate-45"></span>
                    </span>
                </button>
            ) : (
                // GUEST: Show Login Icon
                <Link 
                    to="/login"
                    className="relative flex flex-col items-center justify-center w-full transition-all duration-300 group text-gray-500 hover:text-white"
                >
                    <LogIn 
                        size={26} 
                        className="group-hover:scale-110 transition-transform duration-300 text-white" 
                        strokeWidth={2}
                    />
                    <span className="absolute left-[70px] bg-white text-black text-sm font-bold px-3 py-1.5 rounded-md opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-[-10px] group-hover:translate-x-0 shadow-lg pointer-events-none z-50 whitespace-nowrap">
                        Sign In
                        <span className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 bg-white rotate-45"></span>
                    </span>
                </Link>
            )}
        </div>

      </nav>

      {/* Request Modal */}
      <RequestModal isOpen={isRequestOpen} onClose={() => setIsRequestOpen(false)} />
    </>
  );
}