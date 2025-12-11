import { useState, useEffect } from "react";
import { fetchMovies, fetchSeries } from "../services/api";
import HeroBanner from "../components/HeroBanner";
import Row from "../components/Row";
import { useOutletContext } from "react-router-dom";

// --- TMDB GENRE ID TO NAME TRANSLATOR ---
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
        // 1. FETCH DATA
        const movieRes = await fetchMovies(1, 100);
        const seriesRes = await fetchSeries(1, 100);

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

        // 3. BUILD DYNAMIC ROWS
        const builtSections: any[] = [];

        // A. Latest Rows
        if (allMovies.length > 0) builtSections.push({ title: "Latest Movies", data: allMovies.slice(0, 20) });
        if (allSeries.length > 0) builtSections.push({ title: "Latest Series", data: allSeries.slice(0, 20) });

        // B. Custom Collections (Spider-Man & Doraemon)
        const spiderManContent = allContent.filter(item => 
          (item.title || item.name || "").toLowerCase().includes("spider-man")
        );
        if (spiderManContent.length > 0) {
          builtSections.push({ title: "Spider-Man Collection", data: spiderManContent });
        }

        const doraemonContent = allContent.filter(item => 
          (item.title || item.name || "").toLowerCase().includes("doraemon")
        );
        if (doraemonContent.length > 0) {
          builtSections.push({ title: "Doraemon Collection", data: doraemonContent });
        }

        // C. Dynamic Genre Rows
        const uniqueGenres = Array.from(new Set(allContent.flatMap((item: any) => item.displayGenres)))
          .filter((genre) => genre !== "Other" && genre)
          .sort();

        uniqueGenres.forEach((genre) => {
          const genreItems = allContent.filter((item: any) => item.displayGenres.includes(genre));
          if (genreItems.length > 0) {
            builtSections.push({
              title: `${genre} Collection`,
              data: genreItems.slice(0, 20)
            });
          }
        });

        setSections(builtSections);

        // 4. LOAD HERO BANNER (Original Logic)
        setHeroMovies(allMovies.slice(0, 5));

      } catch (error) {
        console.error("Error loading content:", error);
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
      
      {/* 1. Hero Banner */}
      {heroMovies.length > 0 && <HeroBanner movies={heroMovies} />}

      {/* 2. Dynamic Content Rows */}
      <div className="relative z-10 -mt-16 md:-mt-10 space-y-8">
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