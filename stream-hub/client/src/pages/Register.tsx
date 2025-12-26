import React, { useState } from "react";
import { registerUser } from "../services/api";
import { useNavigate, Link } from "react-router-dom";

// Preset Avatars for users to pick
const AVATARS = [
  "https://upload.wikimedia.org/wikipedia/commons/0/0b/Netflix-avatar.png", // Default Blue
  "https://i.pinimg.com/originals/b6/77/cd/b677cd1cde292f261166533d6fe75872.png", // Red
  "https://i.pinimg.com/originals/1b/54/ef/1b54ef69d95f85023a10526703994689.png", // Yellow
  "https://wallpapers.com/images/hd/netflix-profile-pictures-1000-x-1000-qo9h82134t9nv0j0.jpg", // Green
  "https://pbs.twimg.com/media/D8tCa48VsAA4lx5.jpg" // Dark
];

export default function Register() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState(AVATARS[0]);
  
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await registerUser({ 
        username, 
        email, 
        password, 
        avatar: selectedAvatar 
      });
      // On success, redirect to Home
      navigate("/");
      window.location.reload();
    } catch (err: any) {
      setError(err.message || "Failed to register. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-black/90 flex items-center justify-center relative">
        {/* Background Image Effect */}
        <div className="absolute inset-0 z-0 opacity-40 bg-[url('https://assets.nflxext.com/ffe/siteui/vlv3/f841d4c7-10e1-40af-bcae-07a3f8dc141a/f6d7434e-d6de-4185-a6d4-c77a2d08737b/US-en-20220502-popsignuptwoweeks-perspective_alpha_website_medium.jpg')] bg-cover bg-center"></div>
        <div className="absolute inset-0 bg-black/60 z-0"></div>

        {/* Register Card */}
        <div className="z-10 w-full max-w-md bg-black/75 p-8 md:p-12 rounded-lg text-white shadow-2xl border border-gray-800">
            <h1 className="text-3xl font-bold mb-6">Create Account</h1>
            
            {error && (
              <div className="p-3 bg-red-600/20 border border-red-600 rounded text-red-200 text-sm mb-6">
                {error}
              </div>
            )}

            <form onSubmit={handleRegister} className="space-y-5">
                {/* Avatar Selection */}
                <div className="mb-6">
                  <label className="block text-gray-400 text-sm mb-3">Choose your Avatar</label>
                  <div className="flex justify-between gap-2">
                    {AVATARS.map((avatar, index) => (
                      <img 
                        key={index}
                        src={avatar} 
                        alt="Avatar" 
                        onClick={() => setSelectedAvatar(avatar)}
                        className={`w-12 h-12 rounded cursor-pointer transition transform hover:scale-110 border-2 ${selectedAvatar === avatar ? "border-red-600 opacity-100" : "border-transparent opacity-60"}`}
                      />
                    ))}
                  </div>
                </div>

                <div>
                    <input 
                        type="text" 
                        placeholder="Username"
                        className="w-full p-4 bg-[#333] rounded text-white placeholder-gray-400 focus:outline-none focus:bg-[#444] transition"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required 
                    />
                </div>

                <div>
                    <input 
                        type="email" 
                        placeholder="Email address"
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
                    {loading ? "Creating..." : "Sign Up"}
                </button>
            </form>

            <div className="mt-8 text-gray-400 text-sm">
                Already have an account? <Link to="/login" className="text-white hover:underline ml-1">Sign in now.</Link>
            </div>
        </div>
    </div>
  );
}