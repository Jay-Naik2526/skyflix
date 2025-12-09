const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:5000") + "/api/content";

// Helper to normalize response
const normalize = (response: any) => {
  if (Array.isArray(response)) {
    return { data: response, totalPages: 1 };
  }
  return response || { data: [], totalPages: 0 };
};

export const fetchMovies = async (page = 1, limit = 24) => {
  try {
    const res = await fetch(`${API_URL}/movies?page=${page}&limit=${limit}`);
    const json = await res.json();
    return normalize(json); // <--- Auto-fix format
  } catch (error) {
    console.error("Failed to fetch movies", error);
    return { data: [], totalPages: 0 };
  }
};

export const fetchSeries = async (page = 1, limit = 24) => {
  try {
    const res = await fetch(`${API_URL}/series?page=${page}&limit=${limit}`);
    const json = await res.json();
    return normalize(json); // <--- Auto-fix format
  } catch (error) {
    console.error("Failed to fetch series", error);
    return { data: [], totalPages: 0 };
  }
};

export const searchContent = async (query: string) => {
  try {
    const res = await fetch(`${API_URL}/search?query=${query}`);
    return await res.json();
  } catch (error) {
    console.error("Search failed", error);
    return [];
  }
};