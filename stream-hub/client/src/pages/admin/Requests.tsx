import { useState, useEffect } from "react";
import axios from "axios";
import { CheckCircle } from "lucide-react";

// Use environment variables for API URLs in a real application
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function Requests() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/api/admin/requests`);
      setRequests(res.data);
    } catch (error) {
      console.error("Failed to load requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleDelete = async (id: string) => {
    if(!confirm("Remove this request?")) return;
    try {
      await axios.delete(`${API_URL}/api/admin/delete-request?id=${id}`);
      fetchRequests(); // Refresh list
    } catch (e) {
      alert("Failed to delete");
    }
  };

  return (
    <div className="p-8 ml-64 bg-[#0f1014] min-h-screen text-white">
      <h1 className="text-3xl font-bold mb-8">User Requests</h1>

      <div className="bg-[#16181f] rounded-xl border border-white/10 overflow-hidden">
        {loading ? <div className="p-10 text-center text-gray-500">Loading...</div> : 
         requests.length === 0 ? <div className="p-10 text-center text-gray-500">No pending requests.</div> :
        (
          <table className="w-full text-left">
            <thead className="bg-black/20 text-gray-400 text-sm border-b border-white/5">
              <tr>
                <th className="p-4">Title</th>
                <th className="p-4">Year</th>
                <th className="p-4">Platform</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {requests.map((req) => (
                <tr key={req._id} className="hover:bg-white/5">
                  <td className="p-4 font-bold">{req.title}</td>
                  <td className="p-4 text-gray-400">{req.year || "-"}</td>
                  <td className="p-4 text-blue-400">{req.platform || "-"}</td>
                  <td className="p-4 text-right">
                    <button 
                      onClick={() => handleDelete(req._id)}
                      className="p-2 bg-green-900/30 text-green-400 hover:bg-green-900 rounded transition-colors"
                      title="Mark as Done / Delete"
                    >
                      <CheckCircle size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}