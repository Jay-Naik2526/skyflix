import { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Outlet, Navigate } from "react-router-dom";
import axios from "axios";
import { fetchMovies, fetchSeries } from "./services/api";

// --- USER COMPONENTS ---
import Navbar from "./components/Navbar";
import MobileNav from "./components/MobileNav";
import MobileTopBar from "./components/MobileTopBar";
import HeroBanner from "./components/HeroBanner";
import Row from "./components/Row";
import DetailModal from "./components/DetailModal";
import Footer from "./components/Footer";

// --- USER PAGES ---
// Home is defined inline below
import Search from "./pages/Search";
import Watch from "./pages/Watch";
import Download from "./pages/Download";
import Movies from "./pages/Movies";
import Series from "./pages/Series";
import Categories from "./pages/Categories";

// --- ADMIN COMPONENTS & PAGES ---
import AdminSidebar from "./components/admin/AdminSidebar";
import AdminGuard from "./components/admin/AdminGuard";
import RenameTool from "./pages/admin/RenameTool";
import ManagePosts from "./pages/admin/ManagePosts";
import PostEditor from "./pages/admin/PostEditor";
import HomepageManager from "./pages/admin/HomepageManager";
import Duplicates from "./pages/admin/Duplicates";

// --- LAYOUTS ---
function UserLayout({ onMovieClick }: { onMovieClick: (m: any) => void }) {
  return (
    <>
      <Navbar />
      <MobileTopBar />
      <main className="ml-0 md:ml-24 flex flex-col min-h-screen transition-all duration-300">
        <Outlet context={{ onMovieClick }} />
        <Footer />
      </main>
      <MobileNav />
    </>
  );
}

function AdminLayout() {
  return (
    <div className="flex bg-[#0f1014] min-h-screen">
      <AdminSidebar />
      <div className="flex-1 ml-64 transition-all duration-300">
        <Outlet />
      </div>
    </div>
  );
}

// --- HOME PAGE COMPONENT (Updated for Hero Loop) ---
function Home({ onMovieClick }: { onMovieClick: (movie: any) => void }) {
  const [movies, setMovies] = useState<any[]>([]);
  const [series, setSeries] = useState<any[]>([]);
  const [heroMovies, setHeroMovies] = useState<any[]>([]); // ✅ Stores the LIST

  useEffect(() => {
    // Helper: Random Fallback if no admin config
    const pickRandom = (allContent: any[]) => {
      if (allContent && allContent.length > 0) {
        const shuffled = [...allContent].sort(() => 0.5 - Math.random());
        // Pick 5 random items for the slider
        setHeroMovies(shuffled.slice(0, 5));
      }
    };

    const loadContent = async () => {
      try {
        const movieData = await fetchMovies() || [];
        const seriesData = await fetchSeries() || [];
        
        // Handle API response format
        const mList = movieData.data || movieData;
        const sList = seriesData.data || seriesData;

        setMovies(mList);
        setSeries(sList);
        const allContent = [...mList, ...sList];

        // Load Admin Config for Hero Banner
        try {
          const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";
          const configRes = await axios.get(`${API_BASE}/api/admin/homepage`);
          const adminPicks = configRes.data?.bannerItems || [];

          if (adminPicks.length > 0) {
            // Filter out any broken links (null content)
            const validPicks = adminPicks
              .map((item: any) => item.contentId)
              .filter((content: any) => content && (content.title || content.name));
            
            // ✅ IF valid admin picks exist, USE THEM.
            if (validPicks.length > 0) {
                setHeroMovies(validPicks);
            } else {
                pickRandom(allContent);
            }
          } else {
            pickRandom(allContent);
          }
        } catch (configErr) {
          console.warn("API Error (Homepage Config). Using Random.");
          pickRandom(allContent);
        }

      } catch (error) {
        console.error("Critical Error:", error);
      }
    };

    loadContent();
  }, []);

  return (
    <div className="min-h-screen bg-[#0f1014] text-white overflow-x-hidden pb-20">
      
      {/* ✅ CORRECTED: Pass the ARRAY 'heroMovies' to the new component */}
      {heroMovies.length > 0 && <HeroBanner movies={heroMovies} />}
      
      <div className="relative z-10 -mt-16 md:-mt-10 space-y-8">
        {movies.length > 0 && <Row title="Latest Movies" data={movies} isVertical={true} onMovieClick={onMovieClick} />}
        {series.length > 0 && <Row title="Latest Series" data={series} onMovieClick={onMovieClick} />}
      </div>
    </div>
  );
}
// --- MAIN APP COMPONENT ---
export default function App() {
  const [selectedMovie, setSelectedMovie] = useState<any>(null);

  return (
    <Router>
      <div className="bg-[#0f1014] min-h-screen font-sans selection:bg-blue-600 selection:text-white">
        <Routes>
          {/* USER ROUTES */}
          <Route element={<UserLayout onMovieClick={setSelectedMovie} />}>
            <Route path="/" element={<Home onMovieClick={setSelectedMovie} />} />
            <Route path="/search" element={<Search />} />
            <Route path="/movies" element={<Movies />} />
            <Route path="/tv" element={<Series />} />
            <Route path="/categories" element={<Categories />} />
            <Route path="/watch" element={<Watch />} />
            <Route path="/download" element={<Download />} />
          </Route>

          {/* ADMIN ROUTES */}
          <Route path="/admin" element={<AdminGuard><AdminLayout /></AdminGuard>}>
            <Route index element={<Navigate to="/admin/posts" replace />} />
            <Route path="rename" element={<RenameTool />} />
            <Route path="posts" element={<ManagePosts />} />
            <Route path="post-editor" element={<PostEditor />} />
            <Route path="homepage" element={<HomepageManager />} />
            <Route path="duplicates" element={<Duplicates />} />
          </Route>
        </Routes>

        {/* Global Detail Modal */}
        {selectedMovie && <DetailModal isOpen={!!selectedMovie} movie={selectedMovie} onClose={() => setSelectedMovie(null)} />}
      </div>
    </Router>
  );
}