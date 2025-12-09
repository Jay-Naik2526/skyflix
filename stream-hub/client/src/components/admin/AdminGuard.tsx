import { useState, useEffect } from "react";
import { Lock, ArrowRight } from "lucide-react";

interface AdminGuardProps {
  children: React.ReactNode;
}

export default function AdminGuard({ children }: AdminGuardProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);

  // 1. Check Session on Load
  useEffect(() => {
    const session = sessionStorage.getItem("admin_token");
    if (session === "access_granted") {
      setIsAuthenticated(true);
    }
  }, []);

  // 2. Handle Unlock Attempt
  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    
    // --- UPDATED SECURITY ---
    const SECRET_KEY = "Zends@33@88@99@00"; 
    // ------------------------

    if (password === SECRET_KEY) {
      sessionStorage.setItem("admin_token", "access_granted");
      setIsAuthenticated(true);
      setError(false);
    } else {
      setError(true);
      setPassword("");
    }
  };

  if (isAuthenticated) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-[#0f1014] flex flex-col items-center justify-center text-white px-4">
      <div className="w-full max-w-md bg-[#16181f] p-8 rounded-2xl border border-white/10 shadow-2xl text-center">
        
        <div className="w-16 h-16 bg-blue-600/20 rounded-full flex items-center justify-center mx-auto mb-6 text-blue-500">
          <Lock size={32} />
        </div>

        <h1 className="text-2xl font-bold mb-2">Admin Access</h1>
        <p className="text-gray-500 mb-8 text-sm">Restricted Area. Authorized personnel only.</p>

        <form onSubmit={handleUnlock} className="relative">
          <input 
            type="password" 
            placeholder="Enter Password" 
            className={`w-full bg-black/40 border ${error ? "border-red-500" : "border-white/10"} rounded-xl px-4 py-4 text-center text-xl font-bold focus:outline-none focus:border-blue-500 transition-colors`}
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError(false); }}
            autoFocus
          />
          
          <button 
            type="submit"
            className="absolute right-2 top-2 bottom-2 bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-lg transition-colors flex items-center justify-center"
          >
            <ArrowRight size={20} />
          </button>
        </form>

        {error && (
          <p className="text-red-500 text-sm mt-4 font-bold animate-pulse">
            Access Denied. Incorrect Password.
          </p>
        )}
      </div>
      
      <p className="mt-8 text-gray-600 text-xs">StreamHub Secure System v1.1</p>
    </div>
  );
}