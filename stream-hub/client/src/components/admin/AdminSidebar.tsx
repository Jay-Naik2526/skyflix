import { Link, useLocation } from "react-router-dom";
import { FileText, Edit, Layout, AlertTriangle, MessageSquare } from "lucide-react"; // ✅ Import MessageSquare

export default function AdminSidebar() {
  const location = useLocation();
  
  const menu = [
    { name: "Rename Tool", path: "/admin/rename", icon: FileText },
    { name: "Manage Posts", path: "/admin/posts", icon: Edit },
    { name: "Homepage", path: "/admin/homepage", icon: Layout },
    { name: "Requests", path: "/admin/requests", icon: MessageSquare }, // ✅ NEW ITEM
    { name: "Duplicates", path: "/admin/duplicates", icon: AlertTriangle },
  ];

  return (
    <div className="w-64 bg-[#111] h-screen fixed left-0 top-0 border-r border-gray-800 p-6 z-50">
      <h1 className="text-2xl font-bold text-white mb-10 pl-2 border-l-4 border-blue-600">Admin Panel</h1>
      
      <div className="flex flex-col gap-2">
        {menu.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link 
              key={item.name} 
              to={item.path}
              className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-200 font-medium ${
                isActive 
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-900/50" 
                  : "text-gray-400 hover:bg-white/5 hover:text-white"
              }`}
            >
              <item.icon size={20} />
              {item.name}
            </Link>
          );
        })}
      </div>

      {/* Footer Info */}
      <div className="absolute bottom-6 left-6 text-xs text-gray-600">
        <p>StreamHub CMS v1.2</p>
      </div>
    </div>
  );
}