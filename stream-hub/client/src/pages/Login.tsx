import React, { useState } from "react";
import { loginUser } from "../services/api";
import { useNavigate, Link } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await loginUser({ email, password });
      // On success, redirect to Home
      navigate("/");
      // Force a reload to refresh the Navbar state (simple fix)
      window.location.reload();
    } catch (err: any) {
      setError(err.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-black/90 flex items-center justify-center relative">
        {/* Background Image Effect */}
        <div className="absolute inset-0 z-0 opacity-40 bg-[url('https://assets.nflxext.com/ffe/siteui/vlv3/f841d4c7-10e1-40af-bcae-07a3f8dc141a/f6d7434e-d6de-4185-a6d4-c77a2d08737b/US-en-20220502-popsignuptwoweeks-perspective_alpha_website_medium.jpg')] bg-cover bg-center"></div>
        <div className="absolute inset-0 bg-black/60 z-0"></div>

        {/* Login Card */}
        <div className="z-10 w-full max-w-md bg-black/75 p-8 md:p-16 rounded-lg text-white shadow-2xl border border-gray-800">
            <h1 className="text-3xl font-bold mb-8">Sign In</h1>
            
            {error && (
              <div className="p-3 bg-red-600/20 border border-red-600 rounded text-red-200 text-sm mb-6">
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-6">
                <div>
                    <input 
                        type="email" 
                        placeholder="Email or phone number"
                        className="w-full p-4 bg-[#333] rounded text-white placeholder-gray-400 focus:outline-none focus:bg-[#444] transition"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required 
                    />
                </div>
                <div>
                    <input 
                        type="password" 
                        placeholder="Password"
                        className="w-full p-4 bg-[#333] rounded text-white placeholder-gray-400 focus:outline-none focus:bg-[#444] transition"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>
                
                <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full bg-red-600 py-3.5 rounded font-bold text-lg hover:bg-red-700 transition disabled:opacity-50"
                >
                    {loading ? "Signing In..." : "Sign In"}
                </button>
            </form>

            <div className="mt-10 text-gray-400">
                New to Skyflix? <Link to="/register" className="text-white hover:underline ml-1">Sign up now.</Link>
            </div>
        </div>
    </div>
  );
}