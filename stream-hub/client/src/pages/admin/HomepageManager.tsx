import { useState, useEffect } from "react";
import axios from "axios";
import { Plus, Trash, Save, Search } from "lucide-react";

// Use environment variables for API URLs in a real application
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function HomepageManager() {
  const [config, setConfig] = useState<any>({ bannerItems: [], categories: [] });
  const [allPosts, setAllPosts] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [confRes, postsRes] = await Promise.all([
          axios.get(`${API_URL}/api/admin/homepage`),
          // LOGICAL FIX: The /api/admin/posts endpoint is paginated. To make the
          // search work across all items, you must fetch all of them. A high limit
          // is a temporary fix. A better long-term solution is a dedicated API
          // endpoint like `/api/admin/all-post-titles` that returns just names and IDs.
          axios.get(`${API_URL}/api/admin/posts?limit=10000`)
        ]);
        setConfig(confRes.data);
        // The response for posts might be an object with a `posts` array
        setAllPosts(postsRes.data.posts || postsRes.data);
      } catch (error) {
        console.error("Failed to load homepage manager data:", error);
        alert("Could not load data. Please check the console.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleSave = async () => {
    try {
      await axios.post(`${API_URL}/api/admin/homepage`, config);
      alert("Homepage Updated!");
    } catch (error) {
      console.error("Failed to save homepage config:", error);
      alert("Failed to save changes.");
    }
  };

  const getPostName = (id: string) => {
    const post = allPosts.find(p => p._id === id);
    return post ? `${post.name || post.title} (${post.type})` : "Unknown ID";
  };

  const addToBanner = (post: any) => {
    if (config.bannerItems.some((b: any) => (b.contentId?._id || b.contentId) === post._id)) return;
    setConfig({
      ...config,
      bannerItems: [...config.bannerItems, { contentId: post._id, onModel: post.type }]
    });
  };

  const removeFromBanner = (index: number) => {
    const newBanner = [...config.bannerItems];
    newBanner.splice(index, 1);
    setConfig({ ...config, bannerItems: newBanner });
  };

  const searchResults = search.length > 2
    ? allPosts.filter(p => (p.name || p.title || '').toLowerCase().includes(search.toLowerCase()))
    : [];

  if (loading) {
    return <div className="p-8 ml-64 bg-[#0f1014] min-h-screen text-white">Loading configuration...</div>
  }

  return (
    <div className="p-8 ml-64 bg-[#0f1014] min-h-screen text-white pb-32">
      <div className="flex justify-between items-center mb-8 sticky top-0 bg-[#0f1014]/95 p-4 z-50 border-b border-white/10">
        <h1 className="text-3xl font-bold">Homepage Layout</h1>
        <button onClick={handleSave} className="flex items-center gap-2 px-6 py-2 bg-green-600 rounded-lg font-bold hover:bg-green-700">
          <Save size={20} /> Save Changes
        </button>
      </div>

      <div className="max-w-4xl mx-auto space-y-10">

        <div className="bg-[#16181f] p-6 rounded-xl border border-white/10">
          <h2 className="text-xl font-bold mb-4 text-blue-400">Hero Banner Slider</h2>

          <div className="relative mb-6">
            <div className="flex items-center bg-black/40 rounded border border-white/10 p-2">
              <Search className="text-gray-500 mr-2" size={18} />
              <input
                className="bg-transparent outline-none w-full text-sm"
                placeholder="Search movie/series to add..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            {searchResults.length > 0 && (
              <div className="absolute top-full left-0 w-full bg-[#222] border border-white/10 rounded mt-1 max-h-60 overflow-y-auto z-10 shadow-xl">
                {searchResults.slice(0, 10).map(p => ( // Limit to 10 results for performance
                  <button
                    key={p._id}
                    onClick={() => { addToBanner(p); setSearch(""); }}
                    className="w-full text-left p-3 hover:bg-blue-600/20 text-sm border-b border-white/5"
                  >
                    {p.name || p.title} <span className="opacity-50 text-xs ml-2">({p.type})</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            {config.bannerItems.map((item: any, idx: number) => {
              const name = item.contentId?.title || item.contentId?.name || getPostName(item.contentId);
              return (
                <div key={idx} className="flex justify-between items-center bg-black/30 p-3 rounded border border-white/5">
                  <span className="font-bold">{idx + 1}. {name}</span>
                  <button onClick={() => removeFromBanner(idx)} className="text-red-500 hover:text-white p-1"><Trash size={16} /></button>
                </div>
              );
            })}
            {config.bannerItems.length === 0 && <p className="text-gray-500 text-sm">No items in banner yet.</p>}
          </div>
        </div>

        <div className="opacity-50 pointer-events-none">
          <h2 className="text-xl font-bold mb-4 text-gray-500">Custom Category Rows (Coming Soon)</h2>
          <div className="p-10 border border-dashed border-white/10 rounded text-center text-gray-600">
            Feature under construction. Currently using auto-generated rows.
          </div>
        </div>

      </div>
    </div>
  );
}
