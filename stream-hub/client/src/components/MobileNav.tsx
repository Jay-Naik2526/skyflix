import { Home, Search, Tv, Film, LayoutGrid } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

export default function MobileNav() {
  const location = useLocation();

  const links = [
    { name: "Home", icon: Home, path: "/" },
    { name: "Search", icon: Search, path: "/search" },
    { name: "Series", icon: Tv, path: "/tv" },
    { name: "Movies", icon: Film, path: "/movies" },
    { name: "More", icon: LayoutGrid, path: "/categories" },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 w-full bg-[#0f1014]/95 backdrop-blur-md border-t border-white/10 z-50 pb-safe">
      {/* Added px-6 and justify-between for better spacing */}
      <div className="flex justify-between items-center h-16 px-8"> 
        {links.map((link) => {
          const isActive = location.pathname === link.path;
          return (
            <Link 
              key={link.name} 
              to={link.path}
              className={`flex flex-col items-center justify-center transition-colors ${isActive ? "text-white scale-110" : "text-gray-500"}`}
            >
              <link.icon 
                size={24} 
                strokeWidth={isActive ? 2.5 : 2}
                className={isActive ? "text-blue-500 drop-shadow-md" : ""}
              />
            </Link>
          );
        })}
      </div>
    </div>
  );
}