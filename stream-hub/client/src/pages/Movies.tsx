import { useEffect, useState } from "react";
import { fetchMovies } from "../services/api";
import ContentGrid from "../components/ContentGrid";
import { useOutletContext } from "react-router-dom";

export default function Movies() {
  const [movies, setMovies] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const { onMovieClick } = useOutletContext<any>();

  const loadMovies = async (pageNum: number) => {
    if (loading) return;
    setLoading(true);

    try {
      const res = await fetchMovies(pageNum, 24);
      // FIX: Access res.data properly
      const newMovies = res.data || [];
      
      if (pageNum === 1) {
        setMovies(newMovies);
      } else {
        setMovies(prev => [...prev, ...newMovies]);
      }
      // Check if we reached the last page
      setHasMore(pageNum < (res.totalPages || 1));
      setPage(pageNum);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMovies(1);
  }, []);

  return (
    <>
      <ContentGrid title="All Movies" data={movies} onMovieClick={onMovieClick} />
      {hasMore && (
        <div className="flex justify-center pb-20 bg-[#0f1014]">
          <button
            onClick={() => loadMovies(page + 1)}
            disabled={loading}
            className="bg-white text-black px-8 py-3 rounded-full font-bold hover:bg-gray-200 transition disabled:opacity-50"
          >
            {loading ? "Loading..." : "Load More"}
          </button>
        </div>
      )}
    </>
  );
}