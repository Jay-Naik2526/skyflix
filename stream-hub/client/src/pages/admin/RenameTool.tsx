import { useState } from "react";
import axios from "axios";

export default function RenameTool() {
  const [files, setFiles] = useState<any[]>([]);
  const [rightText, setRightText] = useState("");
  const [loading, setLoading] = useState(false);

  // 1. Fetch Files from RPMShare (Filtered)
  const fetchFiles = async () => {
    setLoading(true);
    const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
    try {
        const res = await axios.get(`${API_URL}/api/admin/files`);
        
        // ✅ FILTER: Only show files that DO NOT contain "SKYFLIX"
        // This ensures the admin only sees files that need standardizing
        const unfinishedFiles = res.data.filter((f: any) => !f.name.includes("SKYFLIX"));
        
        setFiles(unfinishedFiles);
    } catch (err) {
        console.error(err);
        alert("Failed to fetch files.");
    } finally {
        setLoading(false);
    }
  };

  // 2. Copy to Clipboard
  const handleCopy = () => {
    const text = files.map(f => f.name).join("\n");
    navigator.clipboard.writeText(text);
    alert(`Copied ${files.length} filenames to clipboard!`);
  };

  // 3. Execute Rename
  const handleRename = async () => {
    const newNames = rightText.split("\n").filter(n => n.trim() !== "");

    if (newNames.length !== files.length) {
      alert(`Mismatch! Left has ${files.length} files, Right has ${newNames.length} names.`);
      return;
    }

    const updates = files.map((file, index) => ({
      id: file.id,
      newName: newNames[index].trim()
    }));

    setLoading(true);
    const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
    try {
        await axios.post(`${API_URL}/api/admin/rename`, { updates });
        alert("Renaming Process Started! Check RPMShare in a few minutes.");
        setRightText(""); // Clear input on success
        fetchFiles(); // ✅ Auto-refresh to remove the renamed files from the list
    } catch (err) {
        console.error(err);
        alert("Rename failed.");
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="p-8 ml-64 bg-[#0f1014] min-h-screen text-white">
      <h1 className="text-3xl font-bold mb-8">Rename Tool <span className="text-sm font-normal text-gray-500">(Hides files with 'SKYFLIX')</span></h1>

      <div className="grid grid-cols-2 gap-8 h-[70vh]">

        {/* LEFT PANEL */}
        <div className="bg-[#16181f] p-4 rounded-xl border border-white/10 flex flex-col">
          <div className="flex justify-between mb-4">
            <h2 className="font-bold text-gray-400">Files to Fix ({files.length})</h2>
            <div className="flex gap-2">
              <button onClick={fetchFiles} className="px-3 py-1 bg-blue-600 rounded text-sm hover:bg-blue-700">Fetch</button>
              <button onClick={handleCopy} className="px-3 py-1 bg-gray-700 rounded text-sm hover:bg-gray-600">Copy All</button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto font-mono text-sm bg-black/30 p-4 rounded custom-scrollbar">
            {loading ? (
                <div className="text-center text-gray-500 mt-10">Loading files...</div>
            ) : files.length === 0 ? (
                <div className="text-center text-gray-500 mt-10">
                    <p>No unbranded files found.</p>
                    <p className="text-xs opacity-50 mt-1">All files contain 'SKYFLIX'</p>
                </div>
            ) : (
                files.map(f => <div key={f.id} className="truncate py-0.5">{f.name}</div>)
            )}
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="bg-[#16181f] p-4 rounded-xl border border-white/10 flex flex-col">
          <div className="flex justify-between mb-4">
            <h2 className="font-bold text-gray-400">New Names (Paste Here)</h2>
            <button 
                onClick={handleRename} 
                disabled={loading || files.length === 0} 
                className="px-4 py-1 bg-green-600 rounded text-sm font-bold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {loading ? "Processing..." : "RENAME FILES"}
            </button>
          </div>
          <textarea
            className="flex-1 bg-black/30 p-4 rounded text-sm font-mono focus:outline-none focus:border-blue-500 border border-transparent resize-none custom-scrollbar"
            placeholder="Paste formatted list here..."
            value={rightText}
            onChange={(e) => setRightText(e.target.value)}
          />
        </div>

      </div>
    </div>
  );
}