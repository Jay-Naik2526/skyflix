import { Dialog, DialogPanel, DialogBackdrop } from "@headlessui/react";
import { X, Send } from "lucide-react";
import { useState } from "react";
import axios from "axios";

// API URL Config
const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:5000") + "/api/content";

interface RequestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function RequestModal({ isOpen, onClose }: RequestModalProps) {
  const [formData, setFormData] = useState({ title: "", year: "", platform: "" });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post(`${API_URL}/request`, formData);
      alert("✅ Request Sent! We will upload it soon.");
      setFormData({ title: "", year: "", platform: "" });
      onClose();
    } catch (error) {
      alert("❌ Failed to send request.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <DialogBackdrop className="fixed inset-0 bg-black/80 backdrop-blur-sm" />
      
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="w-full max-w-md bg-[#16181f] rounded-2xl border border-white/10 p-6 shadow-2xl relative">
          <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white"><X size={20} /></button>
          
          <h2 className="text-2xl font-bold text-white mb-2">Request a Movie/Series</h2>
          <p className="text-gray-400 text-xs mb-6">Can't find what you're looking for? Tell us!</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Name (Required)</label>
              <input 
                required
                className="w-full bg-black/30 border border-white/10 rounded-lg p-3 text-white focus:border-blue-500 outline-none"
                placeholder="e.g. Avengers: Endgame"
                value={formData.title}
                onChange={e => setFormData({...formData, title: e.target.value})}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Year (Optional)</label>
                <input 
                  className="w-full bg-black/30 border border-white/10 rounded-lg p-3 text-white focus:border-blue-500 outline-none"
                  placeholder="e.g. 2019"
                  value={formData.year}
                  onChange={e => setFormData({...formData, year: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">OTT Platform (Optional)</label>
                <input 
                  className="w-full bg-black/30 border border-white/10 rounded-lg p-3 text-white focus:border-blue-500 outline-none"
                  placeholder="e.g. Netflix"
                  value={formData.platform}
                  onChange={e => setFormData({...formData, platform: e.target.value})}
                />
              </div>
            </div>

            <button 
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
            >
              <Send size={18} /> {loading ? "Sending..." : "Submit Request"}
            </button>
          </form>
        </DialogPanel>
      </div>
    </Dialog>
  );
}