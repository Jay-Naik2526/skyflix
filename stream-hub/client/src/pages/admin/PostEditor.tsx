import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { Save, Plus, Trash, ArrowLeft, Image as ImageIcon, Film } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function PostEditor() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const id = searchParams.get("id");
  const type = searchParams.get("type");

  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id && type) {
      axios.get(`${API_URL}/api/admin/post-details?id=${id}&type=${type}`)
        .then(res => { setPost(res.data); setLoading(false); })
        .catch(err => {
          console.error("Error loading post:", err);
          alert("Error loading post details.");
          setLoading(false);
        });
    }
  }, [id, type]);

  const handleSave = async () => {
    try {
      await axios.post(`${API_URL}/api/admin/update-post`, { id, type, data: post });
      alert("✅ Saved Successfully! (File renamed on RPMShare if title changed)");
    } catch (error: any) {
      console.error("Failed to save:", error);
      const serverMsg = error.response?.data?.error || error.message;
      alert(`❌ Failed to save: ${serverMsg}`);
    }
  };

  const updateField = (field: string, value: any) => {
    setPost({ ...post, [field]: value });
  };

  const updateEpisode = (seasonIndex: number, epIndex: number, field: string, value: any) => {
    setPost((currentPost: any) => ({
      ...currentPost,
      seasons: currentPost.seasons.map((season: any, sIdx: number) => {
        if (sIdx !== seasonIndex) return season;
        return {
          ...season,
          episodes: season.episodes.map((ep: any, eIdx: number) => {
            if (eIdx !== epIndex) return ep;
            return { ...ep, [field]: value };
          }),
        };
      }),
    }));
  };

  const addEpisode = (seasonIndex: number) => {
    const newSeasons = [...post.seasons];
    const newEpNumber = newSeasons[seasonIndex].episodes.length + 1;
    newSeasons[seasonIndex].episodes.push({
      episode_number: newEpNumber,
      name: `Episode ${newEpNumber}`,
      overview: "",
      still_path: "",
      embedCode: "",
      downloadLink: "",
      isPublished: true
    });
    setPost({ ...post, seasons: newSeasons });
  };

  const deleteEpisode = (seasonIndex: number, epIndex: number) => {
    if (!window.confirm("Are you sure you want to delete this episode?")) return;
    const newSeasons = [...post.seasons];
    newSeasons[seasonIndex].episodes.splice(epIndex, 1);
    setPost({ ...post, seasons: newSeasons });
  };

  if (loading) return <div className="text-white p-10">Loading...</div>;
  if (!post) return <div className="text-white p-10">Could not load post data.</div>;

  const getImageUrl = (path: string) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    return `https://image.tmdb.org/t/p/w500${path}`;
  }

  return (
    <div className="p-8 ml-64 bg-[#0f1014] min-h-screen text-white pb-32">
      <div className="flex items-center justify-between mb-8 sticky top-0 bg-[#0f1014]/95 p-4 z-50 border-b border-white/10">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-white/10 rounded-full"><ArrowLeft /></button>
          <h1 className="text-2xl font-bold">Edit {type}: <span className="text-blue-400">{post.title || post.name}</span></h1>
        </div>
        <button onClick={handleSave} className="flex items-center gap-2 px-6 py-2 bg-green-600 rounded-lg font-bold hover:bg-green-700">
          <Save size={20} /> Save Changes
        </button>
      </div>

      <div className="max-w-4xl mx-auto space-y-8">

        <div className="bg-[#16181f] p-6 rounded-xl border border-white/10 space-y-4">
          <h3 className="font-bold text-gray-400 mb-4 border-b border-white/10 pb-2">General Info</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Title (Renames File on Save)</label>
              <input
                className="w-full bg-black/30 p-2 rounded border border-white/10 focus:border-blue-500 outline-none"
                value={post.title || post.name}
                onChange={(e) => updateField(type === "Movie" ? "title" : "name", e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Rating (TMDB)</label>
              <input
                type="number"
                className="w-full bg-black/30 p-2 rounded border border-white/10 focus:border-blue-500 outline-none"
                value={post.vote_average || 0}
                onChange={(e) => updateField("vote_average", parseFloat(e.target.value))}
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Poster Path (URL or /path.jpg)</label>
            <div className="flex gap-2">
              <input
                className="flex-1 bg-black/30 p-2 rounded border border-white/10 focus:border-blue-500 outline-none"
                value={post.poster_path}
                onChange={(e) => updateField("poster_path", e.target.value)}
              />
              <img src={getImageUrl(post.poster_path)} className="h-10 w-8 object-cover rounded bg-gray-800" alt="Preview" />
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Backdrop Path</label>
            <input
              className="w-full bg-black/30 p-2 rounded border border-white/10 focus:border-blue-500 outline-none"
              value={post.backdrop_path}
              onChange={(e) => updateField("backdrop_path", e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Overview</label>
            <textarea
              className="w-full bg-black/30 p-2 rounded border border-white/10 focus:border-blue-500 outline-none h-24"
              value={post.overview}
              onChange={(e) => updateField("overview", e.target.value)}
            />
          </div>
        </div>

        {type === "Movie" && (
          <div className="bg-[#16181f] p-6 rounded-xl border border-white/10 space-y-4">
            <h3 className="font-bold text-gray-400 mb-4 border-b border-white/10 pb-2">Video Source</h3>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Embed Code (Iframe)</label>
              <textarea
                className="w-full bg-black/30 p-2 rounded border border-white/10 focus:border-blue-500 outline-none font-mono text-sm h-32"
                value={post.embedCode}
                onChange={(e) => updateField("embedCode", e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Download Link</label>
              <input
                className="w-full bg-black/30 p-2 rounded border border-white/10 focus:border-blue-500 outline-none"
                value={post.downloadLink}
                onChange={(e) => updateField("downloadLink", e.target.value)}
              />
            </div>
          </div>
        )}

        {/* --- SERIES EDITOR (This uses the extra icons) --- */}
        {type === "Series" && post.seasons?.map((season: any, sIdx: number) => (
          <div key={sIdx} className="bg-[#16181f] p-6 rounded-xl border border-white/10 space-y-4">
            <div className="flex justify-between items-center border-b border-white/10 pb-2">
              <h3 className="font-bold text-lg text-white">Season {season.season_number}</h3>
              <button onClick={() => addEpisode(sIdx)} className="text-xs bg-blue-600 px-3 py-1 rounded hover:bg-blue-700 flex items-center gap-1">
                <Plus size={14} /> Add Episode
              </button>
            </div>

            <div className="space-y-4">
              {season.episodes.map((ep: any, eIdx: number) => (
                <div key={eIdx} className="bg-black/20 p-4 rounded border border-white/5 hover:border-white/20 transition-colors">
                  <div className="flex gap-4 mb-3">
                    <div className="w-16">
                      <label className="text-[10px] text-gray-500">Ep #</label>
                      <input
                        type="number"
                        className="w-full bg-black/40 p-1 rounded text-center font-bold outline-none"
                        value={ep.episode_number}
                        onChange={(e) => updateEpisode(sIdx, eIdx, "episode_number", parseInt(e.target.value))}
                      />
                    </div>
                    <div className="flex-1">
                      <label className="text-[10px] text-gray-500">Title</label>
                      <input
                        className="w-full bg-black/40 p-1 rounded outline-none"
                        value={ep.name}
                        onChange={(e) => updateEpisode(sIdx, eIdx, "name", e.target.value)}
                      />
                    </div>
                    <button onClick={() => deleteEpisode(sIdx, eIdx)} className="text-red-500 hover:text-red-400 self-end p-2"><Trash size={16} /></button>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] text-gray-500 flex items-center gap-1"><Film size={10} /> Embed Code</label>
                      <input
                        className="w-full bg-black/40 p-1 rounded text-xs font-mono outline-none"
                        value={ep.embedCode}
                        onChange={(e) => updateEpisode(sIdx, eIdx, "embedCode", e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-500 flex items-center gap-1"><ImageIcon size={10} /> Thumbnail Path</label>
                      <input
                        className="w-full bg-black/40 p-1 rounded text-xs outline-none"
                        value={ep.still_path}
                        onChange={(e) => updateEpisode(sIdx, eIdx, "still_path", e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

      </div>
    </div>
  );
}