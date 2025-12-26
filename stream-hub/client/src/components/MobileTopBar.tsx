import { Play, Search, MessageCircleQuestion, LogIn } from "lucide-react";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import RequestModal from "./RequestModal";
import { getMe, logoutUser } from "../services/api";

export default function MobileTopBar() {
  const [isRequestOpen, setIsRequestOpen] = useState(false);
  const [user, setUser] = useState<any>(null);

  // Check Login Status
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
    if (confirm("Are you sure you want to logout?")) {
      await logoutUser();
      window.location.reload();
    }
  };

  return (
    <>
      <div className="md:hidden fixed top-0 left-0 w-full z-40 bg-[#0f1014]/80 backdrop-blur-md border-b border-white/5 px-6 py-4 flex items-center justify-between">
         
         {/* Brand Logo */}
         <Link to="/" className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-sky-400 to-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-sky-900/20">
              <Play fill="white" size={12} className="text-white ml-0.5" />
            </div>
            
            <h1 className="text-xl font-black italic tracking-tighter text-white">
              SKY<span className="text-sky-500">FLIX</span>
            </h1>
         </Link>

         {/* Right Side Actions */}
         <div className="flex items-center gap-3">
             
             {/* 1. Request Button */}
             <button 
                onClick={() => setIsRequestOpen(true)}
                className="p-2 bg-white/5 rounded-full text-sky-400 hover:text-white hover:bg-white/10 transition-colors"
             >
                <MessageCircleQuestion size={20} />
             </button>

             {/* 2. Search Icon */}
             <Link to="/search" className="p-2 bg-white/5 rounded-full text-gray-300 hover:text-white hover:bg-white/10 transition-colors">
                <Search size={20} />
             </Link>

             {/* 3. Auth Button (New) */}
             {user ? (
               // Logged In: Show Avatar
               <button 
                 onClick={handleLogout}
                 className="ml-1 relative"
               >
                 <img 
                    src={user.avatar || "https://upload.wikimedia.org/wikipedia/commons/0/0b/Netflix-avatar.png"} 
                    alt="User"
                    className="w-8 h-8 rounded-full border border-white/20 object-cover"
                 />
               </button>
             ) : (
               // Guest: Show Login Icon
               <Link 
                 to="/login" 
                 className="p-2 bg-red-600/20 text-red-500 rounded-full hover:bg-red-600 hover:text-white transition-colors"
               >
                 <LogIn size={20} />
               </Link>
             )}
         </div>
      </div>

      <RequestModal isOpen={isRequestOpen} onClose={() => setIsRequestOpen(false)} />
    </>
  );
}