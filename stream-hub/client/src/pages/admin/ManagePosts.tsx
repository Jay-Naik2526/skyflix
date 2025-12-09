import { useState, useEffect } from "react";
import axios from "axios";
import { Trash2, Search, RefreshCw, FileVideo, DownloadCloud, Wrench } from "lucide-react";

// It's best practice to define your data structures.
interface Post {
  _id: string;
  title?: string;
  name?: string;
  type: 'Movie' | 'Series';
  poster_path?: string;
  createdAt: string;
}

// Use environment variables for API URLs in a real application
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function ManagePosts() {
  const [posts, setPosts] = useState<Post[]>([]); // Use the Post type
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Pagination State
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Button States
  const [syncing, setSyncing] = useState(false);
  const [fetchingMeta, setFetchingMeta] = useState(false);

  // --- CRASH-PROOF LOAD FUNCTION ---
  const loadPosts = async () => {
    setLoading(true);
    try {
      // NOTE: The search term is NOT passed to the API here.
      // For a large database, search should be a backend feature.
      // Example: `.../api/admin/posts?page=${page}&limit=20&search=${searchTerm}`
      const res = await axios.get(`${API_URL}/api/admin/posts?page=${page}&limit=20`);

      if (res.data.posts && Array.isArray(res.data.posts)) {
        setPosts(res.data.posts);
        setTotalPages(res.data.totalPages || 1);
      }
      else if (Array.isArray(res.data)) {
        setPosts(res.data);
        setTotalPages(1);
      }
      else {
        console.warn("Unexpected API response:", res.data);
        setPosts([]);
      }
    } catch (error) {
      console.error("Error loading posts:", error);
      setPosts([]); // Prevents .filter crash
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPosts();
  }, [page]);

  // --- ACTIONS ---
  const handleSync = async () => {
    // UX Suggestion: Use a toast notification library instead of alert/confirm.
    if (!window.confirm("Start Sync? This will scan the RPMShare folder and add new items to the database.")) return;
    setSyncing(true);
    try {
      alert("Sync started! This may take a while. Check the server terminal for progress.");
      await axios.post(`${API_URL}/api/admin/sync`);
      loadPosts(); // Refresh after sync
    } catch (error: any) {
      alert("Error: " + error.message);
    } finally {
      setSyncing(false);
    }
  };

  const handleFetchMetadata = async () => {
    if (!window.confirm("Start Background Fetch? This will find missing posters and details for all items.")) return;
    setFetchingMeta(true);
    try {
      alert("Background metadata fetch started! This can take a long time.");
      await axios.post(`${API_URL}/api/admin/metadata`);
    } catch (error: any) {
      alert("Error: " + error.message);
    } finally {
      setFetchingMeta(false);
    }
  };

  const handleFixDB = async () => {
    try {
      const res = await axios.post(`${API_URL}/api/admin/fix-db`);
      alert("Fixed: " + JSON.stringify(res.data.details));
    } catch (err) { alert("Error fixing DB"); }
  };

  const handleDeleteAll = async () => {
    if (window.confirm("⚠️ DELETE ALL DATA? This cannot be undone.")) {
      try {
        await axios.delete(`${API_URL}/api/admin/delete-all`);
        alert("Database Cleared.");
        setPosts([]);
        setPage(1);
        setTotalPages(1);
      } catch (err) { alert("Error clearing database."); }
    }
  };

  const handleDelete = async (id: string, type: string) => {
    if (!window.confirm("Delete this item?")) return;
    try {
      await axios.delete(`${API_URL}/api/admin/delete-post?id=${id}&type=${type}`);
      loadPosts(); // Reload the current page's data
    } catch (error) { alert("Failed to delete item."); }
  };

  // Helper to build full image URL
  const getImageUrl = (path: string | undefined) => {
    if (!path) return undefined;
    if (path.startsWith('http')) return path;
    return `https://image.tmdb.org/t/p/w200${path}`;
  }

  // LOGICAL FLAW: This search only filters the items on the *current page*.
  // For a real search across 10k+ items, this logic must be moved to the backend.
  const filteredPosts = posts.filter(p =>
    (p.title || p.name || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 text-white min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Manage Posts</h1>
          <p className="text-gray-400">Page {page} of {totalPages}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button onClick={handleFetchMetadata} disabled={fetchingMeta} className="px-4 py-2 bg-purple-600 rounded flex gap-2 items-center disabled:opacity-50 disabled:cursor-not-allowed"><RefreshCw size={18} className={fetchingMeta ? "animate-spin" : ""} /> Posters</button>
          <button onClick={handleSync} disabled={syncing} className="px-4 py-2 bg-blue-600 rounded flex gap-2 items-center disabled:opacity-50 disabled:cursor-not-allowed"><DownloadCloud size={18} /> Sync</button>
          <button onClick={handleFixDB} className="px-4 py-2 bg-yellow-600 rounded flex gap-2 items-center"><Wrench size={18} /> Fix Rules</button>
          <button onClick={handleDeleteAll} className="px-4 py-2 bg-red-600 rounded flex gap-2 items-center"><Trash2 size={18} /> Reset DB</button>
        </div>
      </div>

      <div className="relative mb-6">
        <input
          type="text"
          placeholder="Search current page... (Backend search is needed for full database)"
          className="w-full bg-[#16181f] border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <Search className="absolute left-4 top-3.5 text-gray-500" size={20} />
      </div>

      <div className="bg-[#16181f] rounded-xl border border-white/10 overflow-hidden">
        {loading ? <div className="p-12 text-center text-gray-500">Loading...</div> :
          filteredPosts.length === 0 ? <div className="p-12 text-center text-gray-500">No posts found.</div> :
            (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-black/20 border-b border-white/5 text-gray-400 text-sm uppercase">
                    <th className="p-4">Title</th>
                    <th className="p-4">Type</th>
                    <th className="p-4">Date</th>
                    <th className="p-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredPosts.map((post) => (
                    <tr key={post._id} className="hover:bg-white/5">
                      <td className="p-4 flex items-center gap-3">
                        <div className="w-10 h-10 rounded bg-gray-800 overflow-hidden flex-shrink-0">
                          {post.poster_path ? <img src={getImageUrl(post.poster_path)} className="w-full h-full object-cover" /> : <FileVideo className="m-2 text-gray-600" />}
                        </div>
                        {post.title || post.name}
                      </td>
                      <td className="p-4">
                        <span className={`text-xs font-bold px-2 py-1 rounded ${post.type === 'Movie' ? 'bg-green-900/50 text-green-300' : 'bg-blue-900/50 text-blue-300'}`}>
                          {post.type}
                        </span>
                      </td>
                      <td className="p-4 text-sm text-gray-500">{new Date(post.createdAt).toLocaleDateString()}</td>
                      <td className="p-4 text-right"><button onClick={() => handleDelete(post._id, post.type)} className="text-gray-400 hover:text-red-500"><Trash2 size={18} /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
      </div>

      <div className="flex justify-center gap-4 mt-8 pb-12">
        <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-4 py-2 bg-white/10 rounded disabled:opacity-50">Prev</button>
        <span className="text-gray-400 py-2">Page {page} of {totalPages}</span>
        <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="px-4 py-2 bg-white/10 rounded disabled:opacity-50">Next</button>
      </div>
    </div>
  );
}
