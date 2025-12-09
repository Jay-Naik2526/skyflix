import { Play } from "lucide-react";

interface ContentGridProps {
  title: string;
  data: any[];
  onMovieClick: (movie: any) => void;
}

export default function ContentGrid({ title, data, onMovieClick }: ContentGridProps) {
  return (
    <div className="pt-24 px-6 md:px-12 min-h-screen bg-[#0f1014] text-white">
      <h1 className="text-3xl font-black mb-8 italic">{title}</h1>
      
      {data.length === 0 ? (
        <div className="text-gray-500 text-center mt-20">No content found.</div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {data.map((item) => (
            <div 
              key={item._id || item.id} 
              className="relative group cursor-pointer transition-transform duration-300 hover:scale-105 hover:z-20"
              onClick={() => onMovieClick(item)}
            >
              <img 
                src={item.poster_path} 
                alt={item.title || item.name} 
                className="rounded-lg w-full h-auto object-cover aspect-[2/3]"
              />
              
              {/* Hover Overlay */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex flex-col items-center justify-center p-2 text-center">
                <h3 className="font-bold text-sm mb-2">{item.title || item.name}</h3>
                <div className="bg-white text-black p-2 rounded-full">
                  <Play size={16} fill="black" />
                </div>
                <div className="mt-2 text-xs text-green-400 font-bold">98% Match</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}