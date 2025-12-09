import { useEffect, useState } from "react";
import { fetchSeries } from "../services/api";
import ContentGrid from "../components/ContentGrid";
import { useOutletContext } from "react-router-dom";

export default function Series() {
  const [series, setSeries] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const { onMovieClick } = useOutletContext<any>();

  const loadSeries = async (pageNum: number) => {
    if (loading) return;
    setLoading(true);

    try {
      const res = await fetchSeries(pageNum, 24);
      // FIX: Access res.data properly
      const newSeries = res.data || [];

      if (pageNum === 1) {
        setSeries(newSeries);
      } else {
        setSeries(prev => [...prev, ...newSeries]);
      }
      setHasMore(pageNum < (res.totalPages || 1));
      setPage(pageNum);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSeries(1);
  }, []);

  return (
    <>
      <ContentGrid title="All Series" data={series} onMovieClick={onMovieClick} />
      {hasMore && (
        <div className="flex justify-center pb-20 bg-[#0f1014]">
          <button
            onClick={() => loadSeries(page + 1)}
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