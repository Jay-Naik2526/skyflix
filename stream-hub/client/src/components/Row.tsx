import { useRef } from "react";
import { ChevronLeft, ChevronRight, Star, Play } from "lucide-react";

interface RowProps {
  title: string;
  data: any[];
  isVertical?: boolean; 
  isNumbered?: boolean; 
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
    <div className="space-y-3 px-5 md:px-12 group mb-8">
      <h2 className="text-lg md:text-2xl font-bold text-white hover:text-blue-400 cursor-pointer transition-colors w-fit flex items-center gap-2">
        {title}
        <span className="text-[10px] font-normal text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity translate-x-[-10px] group-hover:translate-x-0 duration-300">Explore All</span>
      </h2>

      <div className="relative group/slider">
        
        <button 
          onClick={() => slide(-800)}
          className="hidden md:block absolute left-0 top-[35%] z-40 p-3 bg-black/60 text-white rounded-full opacity-0 group-hover/slider:opacity-100 hover:bg-white hover:text-black transition-all disabled:opacity-0 -translate-x-4"
        >
          <ChevronLeft size={24} />
        </button>

        <div 
          ref={rowRef}
          className="flex gap-3 md:gap-4 overflow-x-auto scrollbar-hide pb-4 px-1"
          style={{ scrollSnapType: 'x mandatory' }}
        >
          {data.map((item, index) => {
            const rating = item.vote_average ? item.vote_average.toFixed(1) : "N/A";
            
            return (
              <div 
                key={item._id || item.id || index}
                onClick={() => onMovieClick(item)}
                className={`relative flex-none cursor-pointer transition-all duration-300 hover:scale-105 hover:z-10 group/card ${
                  // ✅ FIX: Smaller Cards on Mobile (110px vs 160px)
                  isNumbered ? "w-[140px] md:w-[240px]" : "w-[110px] md:w-[200px]"
                }`}
              >
                
                <div className="relative rounded-lg overflow-hidden aspect-[2/3] shadow-lg shadow-black/50 border border-white/5">
                  <img 
                    src={item.poster_path} 
                    alt={item.title || item.name} 
                    className="w-full h-full object-cover transition-opacity duration-300 group-hover/card:opacity-80"
                    loading="lazy"
                  />
                  
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/card:opacity-100 transition-opacity duration-300">
                    <div className="bg-white/20 backdrop-blur-sm p-3 rounded-full border border-white/50">
                      <Play fill="white" className="text-white" size={24} />
                    </div>
                  </div>

                  {isNumbered && (
                    <span className="absolute -left-4 -bottom-8 text-[80px] md:text-[100px] font-black text-black text-stroke-white leading-none z-20 drop-shadow-lg">
                      {index + 1}
                    </span>
                  )}
                </div>

                {!isNumbered && (
                  <div className="mt-2 px-1">
                    <h3 className="text-white font-semibold text-xs md:text-base truncate" title={item.title || item.name}>
                      {item.title || item.name}
                    </h3>
                    
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-gray-400 text-[10px] md:text-xs">
                        {item.release_date ? item.release_date.split("-")[0] : item.first_air_date ? item.first_air_date.split("-")[0] : "2024"}
                      </span>

                      <div className="flex items-center gap-1 bg-[#16181f] border border-white/10 px-1.5 py-0.5 rounded text-[9px] md:text-[10px] text-yellow-400 font-bold">
                        <Star size={8} fill="currentColor" />
                        <span>{rating}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <button 
          onClick={() => slide(800)}
          className="hidden md:block absolute right-0 top-[35%] z-40 p-3 bg-black/60 text-white rounded-full opacity-0 group-hover/slider:opacity-100 hover:bg-white hover:text-black transition-all translate-x-4"
        >
          <ChevronRight size={24} />
        </button>

      </div>
    </div>
  );
}