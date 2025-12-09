import { useState, useEffect } from "react";
import axios from "axios";
import { Trash, AlertTriangle, RefreshCw } from "lucide-react";

export default function Duplicates() {
  const [duplicates, setDuplicates] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchDuplicates = async () => {
    setLoading(true);
    try {
      const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
      const res = await axios.get(`${API_URL}/api/admin/duplicates`);
      // The API returns groups of duplicates. We flat map them for display or keep as groups.
      setDuplicates(res.data.movies || []);
    } catch (error) {
      console.error("Error fetching duplicates");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchDuplicates();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this duplicate copy?")) return;
    const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
    await axios.delete(`${API_URL}/api/admin/post-delete?id=${id}&type=Movie`);
    fetchDuplicates(); // Refresh list
  };

  return (
    <div className="p-8 ml-64 bg-[#0f1014] min-h-screen text-white">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <AlertTriangle className="text-yellow-500" /> Duplicate Finder
        </h1>
        <button onClick={fetchDuplicates} className="p-2 bg-gray-800 rounded hover:bg-white/10">
          <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      <div className="space-y-6">
        {duplicates.length === 0 && !loading && (
          <div className="text-center text-gray-500 py-20 bg-[#16181f] rounded-xl border border-white/5">
            <p>No duplicates found! Your database is clean.</p>
          </div>
        )}

        {duplicates.map((group: any) => (
          <div key={group._id} className="bg-[#16181f] p-6 rounded-xl border border-yellow-500/20">
            <h3 className="text-xl font-bold text-white mb-4">
              "{group.name}" <span className="text-gray-500 text-sm">({group.count} copies found)</span>
            </h3>

            <div className="space-y-3">
              {group.ids.map((id: string, index: number) => (
                <div key={id} className="flex justify-between items-center bg-black/30 p-3 rounded border border-white/5">
                  <span className="text-mono text-sm text-gray-400">ID: {id}</span>
                  <div className="flex items-center gap-3">
                    {index === 0 && <span className="text-xs bg-green-900 text-green-200 px-2 py-1 rounded">Keep This</span>}
                    <button
                      onClick={() => handleDelete(id)}
                      className="flex items-center gap-2 px-3 py-1 bg-red-900/30 text-red-400 rounded hover:bg-red-900 text-sm"
                    >
                      <Trash size={14} /> Delete
                    </button>
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