import { useState, useEffect } from "react";
import { fetchMovies, fetchSeries } from "../services/api";
import HeroBanner from "../components/HeroBanner";
import Row from "../components/Row";
import { useOutletContext } from "react-router-dom";

// --- TMDB GENRE ID MAP ---
const GENRE_MAP: Record<string, string> = {
  "28": "Action", "12": "Adventure", "16": "Animation", "35": "Comedy",
  "80": "Crime", "99": "Documentary", "18": "Drama", "10751": "Family",
  "14": "Fantasy", "36": "History", "27": "Horror", "10402": "Music",
  "9648": "Mystery", "10749": "Romance", "878": "Sci-Fi", "10770": "TV Movie",
  "53": "Thriller", "10752": "War", "37": "Western", "10759": "Action & Adventure",
  "10765": "Sci-Fi & Fantasy", "10768": "War & Politics"
};

export default function Home() {
  const [heroMovies, setHeroMovies] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const context = useOutletContext<any>();
  const onMovieClick = context?.onMovieClick || (() => {});

  useEffect(() => {
    const loadContent = async () => {
      setLoading(true);
      try {
        // 1. FETCH CONTENT
        const [movieRes, seriesRes] = await Promise.all([
          fetchMovies(1, 150),
          fetchSeries(1, 150)
        ]);

        const movies = movieRes.data || [];
        const series = seriesRes.data || [];

        // 2. PROCESS ITEMS
        const processItem = (item: any) => ({
          ...item,
          displayGenres: item.genre_ids?.map((id: string) => GENRE_MAP[id] || "Other") || []
        });

        const allMovies = movies.map(processItem);
        const allSeries = series.map(processItem);
        const allContent = [...allMovies, ...allSeries];

        // 3. BUILD AUTOMATIC COLLECTIONS
        const builtSections: any[] = [];

        // --- A. FRANCHISE HUBS (Marvel, DC) ---
        // FIX: Added (item: any) to all filters below
        const marvelItems = allContent.filter((item: any) => 
          item.production_companies?.some((c: any) => c.name.toLowerCase().includes("marvel")) ||
          item.keywords?.some((k: any) => k.name === "marvel comic" || k.name === "superhero")
        );
        if (marvelItems.length > 0) builtSections.push({ title: "Marvel Universe", data: marvelItems });

        const dcItems = allContent.filter((item: any) => 
          item.production_companies?.some((c: any) => c.name.toLowerCase().includes("dc entertainment") || c.name.toLowerCase().includes("dc comics")) ||
          item.keywords?.some((k: any) => k.name === "dc comics")
        );
        if (dcItems.length > 0) builtSections.push({ title: "DC Multiverse", data: dcItems });

        // --- B. REGIONAL ZONES (Bollywood, K-Drama) ---
        // This was the specific error line (Line 68)
        const bollywoodItems = allContent.filter((item: any) => item.original_language === "hi");
        if (bollywoodItems.length > 0) builtSections.push({ title: "Bollywood Hits 🇮🇳", data: bollywoodItems });

        const kDramaItems = allSeries.filter((item: any) => item.original_language === "ko");
        if (kDramaItems.length > 0) builtSections.push({ title: "K-Drama & Korean Hits 🇰🇷", data: kDramaItems });

        // --- C. ANIME WORLD (Japanese + Animation) ---
        const animeItems = allContent.filter((item: any) => 
          (item.original_language === "ja" && item.displayGenres.includes("Animation")) ||
          item.keywords?.some((k: any) => k.name === "anime")
        );
        if (animeItems.length > 0) builtSections.push({ title: "Anime World 🇯🇵", data: animeItems });

        // --- D. KIDS ZONE (Safe Content) ---
        const kidsItems = allContent.filter((item: any) => {
          const isAdult = item.content_rating === "R" || item.content_rating === "TV-MA";
          if (isAdult) return false;
          const hasKidsGenre = item.displayGenres.includes("Family") || item.displayGenres.includes("Animation");
          const hasKidsKeyword = item.keywords?.some((k: any) => ["cartoon", "kids", "children"].includes(k.name));
          return hasKidsGenre || hasKidsKeyword;
        });
        const pureKids = kidsItems.filter((k: any) => !animeItems.includes(k)); 
        if (pureKids.length > 0) builtSections.push({ title: "Kids & Family 🎈", data: pureKids });


        // --- E. 🌟 DYNAMIC FRANCHISE COLLECTIONS 🌟 ---
        const collections: Record<string, any[]> = {};

        // FIX: Added (item: any) here too
        allContent.forEach((item: any) => {
          let key = null;

          // Strategy 1: Official TMDB Collection
          if (item.collectionInfo?.name) {
             key = item.collectionInfo.name.replace(" Collection", ""); 
          }
          // Strategy 2: Smart Name Matching
          else {
             const rawTitle = item.title || item.name || "";
             const match = rawTitle.match(/^([a-zA-Z\s]+)/); 
             if (match && match[1].trim().length > 3) {
                 const root = match[1].trim().split(" ").slice(0, 2).join(" "); 
                 if (root.length > 4) key = root; 
             }
          }

          if (key) {
             if (!collections[key]) collections[key] = [];
             collections[key].push(item);
          }
        });

        // Filter: Only show collections with MORE THAN 2 items
        Object.keys(collections).sort().forEach(key => {
            const items = collections[key];
            if (items.length > 2) {
                const isDuplicate = builtSections.some(s => s.title.toLowerCase().includes(key.toLowerCase()));
                if (!isDuplicate) {
                    builtSections.push({ title: `${key} Collection`, data: items });
                }
            }
        });
        // ------------------------------------------------


        // --- F. STANDARD ROWS ---
        if (allMovies.length > 0) builtSections.push({ title: "Latest Movies", data: allMovies.slice(0, 20) });
        if (allSeries.length > 0) builtSections.push({ title: "Latest TV Shows", data: allSeries.slice(0, 20) });

        // --- G. HOLLYWOOD ---
        const hollywoodItems = allContent.filter((item: any) => item.original_language === "en");
        if (hollywoodItems.length > 0) builtSections.push({ title: "Hollywood Blockbusters", data: hollywoodItems.slice(0, 20) });

        setSections(builtSections);
        setHeroMovies(allMovies.slice(0, 6)); 

      } catch (error) {
        console.error("Error loading home content:", error);
      } finally {
        setLoading(false);
      }
    };

    loadContent();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f1014] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f1014] text-white overflow-x-hidden pb-20 relative">
      {heroMovies.length > 0 && <HeroBanner movies={heroMovies} />}
      <div className="relative z-10 -mt-16 md:-mt-10 space-y-8 pl-4 md:pl-12">
        {sections.map((section, index) => (
          <Row
            key={index}
            title={section.title}
            data={section.data}
            onMovieClick={onMovieClick}
          />
        ))}
      </div>
    </div>
  );
}