import { useRef } from "react";
import { ChevronLeft, ChevronRight, Star, Play } from "lucide-react";

interface RowProps {
  title: string;
  data: any[];
  isVertical?: boolean; // Not used often, but kept for compatibility
  isNumbered?: boolean; // For "Top 10" style rows
  onMovieClick: (movie: any) => void;
}

export default function Row({ title, data, isNumbered = false, onMovieClick }: RowProps) {
  const rowRef = useRef<HTMLDivElement>(null);

  const slide = (offset: number) => {
    if (rowRef.current) {
      rowRef.current.scrollBy({ left: offset, behavior: "smooth" });
    }
  };

  if (!data || data.length === 0) return null;

  return (
    <div className="space-y-4 px-6 md:px-12 group">
      {/* Row Header */}
      <h2 className="text-xl md:text-2xl font-bold text-white hover:text-blue-400 cursor-pointer transition-colors w-fit flex items-center gap-2">
        {title}
        <span className="text-xs font-normal text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity translate-x-[-10px] group-hover:translate-x-0 duration-300">Explore All</span>
      </h2>

      {/* Row Container */}
      <div className="relative group/slider">
        
        {/* Left Arrow */}
        <button 
          onClick={() => slide(-800)}
          className="absolute left-0 top-[35%] z-40 p-3 bg-black/60 text-white rounded-full opacity-0 group-hover/slider:opacity-100 hover:bg-white hover:text-black transition-all disabled:opacity-0 -translate-x-4"
        >
          <ChevronLeft size={24} />
        </button>

        {/* Scrollable Area */}
        <div 
          ref={rowRef}
          className="flex gap-4 overflow-x-auto scrollbar-hide pb-4 px-1" // Added padding-bottom to avoid cutting off shadows
          style={{ scrollSnapType: 'x mandatory' }}
        >
          {data.map((item, index) => {
            // Calculate Rating (TMDB is out of 10)
            const rating = item.vote_average ? item.vote_average.toFixed(1) : "N/A";
            
            return (
              <div 
                key={item._id || item.id || index}
                onClick={() => onMovieClick(item)}
                className={`relative flex-none cursor-pointer transition-all duration-300 hover:scale-105 hover:z-10 group/card ${
                  isNumbered ? "w-[200px] md:w-[240px]" : "w-[160px] md:w-[200px]"
                }`}
              >
                
                {/* 1. Poster Container */}
                <div className="relative rounded-lg overflow-hidden aspect-[2/3] shadow-lg shadow-black/50 border border-white/5">
                  <img 
                    src={item.poster_path} 
                    alt={item.title || item.name} 
                    className="w-full h-full object-cover transition-opacity duration-300 group-hover/card:opacity-80"
                    loading="lazy"
                  />
                  
                  {/* Hover Play Button Overlay */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/card:opacity-100 transition-opacity duration-300">
                    <div className="bg-white/20 backdrop-blur-sm p-3 rounded-full border border-white/50">
                      <Play fill="white" className="text-white" size={24} />
                    </div>
                  </div>

                  {/* Numbered Rank (for Top 10 rows) */}
                  {isNumbered && (
                    <span className="absolute -left-4 -bottom-8 text-[100px] font-black text-black text-stroke-white leading-none z-20 drop-shadow-lg">
                      {index + 1}
                    </span>
                  )}
                </div>

                {/* 2. Info Section (Name & Rating) */}
                {!isNumbered && (
                  <div className="mt-3 px-1">
                    {/* Title: Truncate ensures it stays on 1 line with '...' */}
                    <h3 className="text-white font-semibold text-sm md:text-base truncate" title={item.title || item.name}>
                      {item.title || item.name}
                    </h3>
                    
                    {/* Metadata Row */}
                    <div className="flex items-center justify-between mt-1">
                      {/* Release Year */}
                      <span className="text-gray-400 text-xs">
                        {item.release_date ? item.release_date.split("-")[0] : item.first_air_date ? item.first_air_date.split("-")[0] : "2024"}
                      </span>

                      {/* Rating Badge */}
                      <div className="flex items-center gap-1 bg-[#16181f] border border-white/10 px-1.5 py-0.5 rounded text-[10px] text-yellow-400 font-bold">
                        <Star size={10} fill="currentColor" />
                        <span>{rating}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Right Arrow */}
        <button 
          onClick={() => slide(800)}
          className="absolute right-0 top-[35%] z-40 p-3 bg-black/60 text-white rounded-full opacity-0 group-hover/slider:opacity-100 hover:bg-white hover:text-black transition-all translate-x-4"
        >
          <ChevronRight size={24} />
        </button>

      </div>
    </div>
  );
}