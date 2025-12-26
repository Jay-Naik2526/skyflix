import { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Outlet, Navigate } from "react-router-dom";

// --- USER COMPONENTS ---
import Navbar from "./components/Navbar";

import MobileTopBar from "./components/MobileTopBar";
import DetailModal from "./components/DetailModal";
import Footer from "./components/Footer";
import MobileNav from "./components/MobileNav";

// --- USER PAGES ---
import Home from "./pages/Home";
import Search from "./pages/Search";
import Watch from "./pages/Watch";
import Download from "./pages/Download";
import Movies from "./pages/Movies";
import Series from "./pages/Series";
import Categories from "./pages/Categories";
import Login from "./pages/Login";       // ✅ NEW
import Register from "./pages/Register"; // ✅ NEW

// --- ADMIN COMPONENTS & PAGES ---
import AdminSidebar from "./components/admin/AdminSidebar";
import AdminGuard from "./components/admin/AdminGuard";
import RenameTool from "./pages/admin/RenameTool";
import ManagePosts from "./pages/admin/ManagePosts";
import PostEditor from "./pages/admin/PostEditor";
import HomepageManager from "./pages/admin/HomepageManager";
import Duplicates from "./pages/admin/Duplicates";
import Requests from "./pages/admin/Requests"; 

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
    <div className="flex min-h-screen bg-gray-900 text-white">
      <AdminSidebar />
      <main className="flex-1 p-8 ml-64 overflow-y-auto">
        <Outlet />
      </main>
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
          
          {/* ✅ PUBLIC AUTH ROUTES (No Navbar) */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* USER ROUTES (With Navbar & Footer) */}
          <Route element={<UserLayout onMovieClick={setSelectedMovie} />}>
            <Route path="/" element={<Home />} />
            <Route path="/search" element={<Search />} />
            <Route path="/movies" element={<Movies />} />
            <Route path="/tv" element={<Series />} />
            <Route path="/categories" element={<Categories />} />
            <Route path="/watch" element={<Watch />} />
            <Route path="/download" element={<Download />} />
          </Route>

          {/* ADMIN ROUTES (Protected) */}
          <Route path="/admin" element={<AdminGuard><AdminLayout /></AdminGuard>}>
            <Route index element={<Navigate to="/admin/posts" replace />} />
            <Route path="rename" element={<RenameTool />} />
            <Route path="posts" element={<ManagePosts />} />
            <Route path="post-editor" element={<PostEditor />} />
            <Route path="homepage" element={<HomepageManager />} />
            <Route path="requests" element={<Requests />} />
            <Route path="duplicates" element={<Duplicates />} />
          </Route>

        </Routes>

        {/* Global Detail Modal (Popup for movies) */}
        {selectedMovie && (
          <DetailModal 
            isOpen={!!selectedMovie} 
            movie={selectedMovie} 
            onClose={() => setSelectedMovie(null)} 
          />
        )}
      </div>
    </Router>
  );
}