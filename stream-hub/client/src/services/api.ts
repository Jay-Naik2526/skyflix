const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
const API_URL = `${BASE_URL}/api`;

// Helper to normalize response
const normalize = (response: any) => {
  if (Array.isArray(response)) {
    return { data: response, totalPages: 1 };
  }
  return response || { data: [], totalPages: 0 };
};

// ==========================================
// 🔐 AUTHENTICATION API
// ==========================================

export const registerUser = async (userData: any) => {
  const res = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(userData),
    credentials: "include", // ✅ Required for Cookies
  });
  if (!res.ok) throw await res.json();
  return res.json();
};

export const loginUser = async (userData: any) => {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(userData),
    credentials: "include", // ✅ Required for Cookies
  });
  if (!res.ok) throw await res.json();
  return res.json();
};

export const logoutUser = async () => {
  const res = await fetch(`${API_URL}/auth/logout`, {
    method: "POST",
    credentials: "include", // ✅ Required for Cookies
  });
  return res.json();
};

export const getMe = async () => {
  const res = await fetch(`${API_URL}/auth/me`, {
    method: "GET",
    credentials: "include", // ✅ Required for Cookies
  });
  if (!res.ok) throw new Error("Not authorized");
  return res.json();
};

// ✅ NEW: Update Watch History
export const updateWatchHistory = async (data: any) => {
  try {
    const res = await fetch(`${API_URL}/auth/history`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
      credentials: "include", 
    });
    return await res.json();
  } catch (error) {
    console.error("Failed to update history", error);
  }
};

// ==========================================
// 🎬 CONTENT API
// ==========================================

export const fetchHomeContent = async () => {
  try {
    const res = await fetch(`${API_URL}/content/home`);
    return await res.json();
  } catch (error) {
    console.error("Failed to fetch home content", error);
    return { banner: [], sections: [] };
  }
};

export const fetchMovies = async (page = 1, limit = 24) => {
  try {
    const res = await fetch(`${API_URL}/content/movies?page=${page}&limit=${limit}`);
    const json = await res.json();
    return normalize(json); 
  } catch (error) {
    console.error("Failed to fetch movies", error);
    return { data: [], totalPages: 0 };
  }
};

export const fetchSeries = async (page = 1, limit = 24) => {
  try {
    const res = await fetch(`${API_URL}/content/series?page=${page}&limit=${limit}`);
    const json = await res.json();
    return normalize(json);
  } catch (error) {
    console.error("Failed to fetch series", error);
    return { data: [], totalPages: 0 };
  }
};

export const searchContent = async (query: string) => {
  try {
    if (!query) return [];
    const res = await fetch(`${API_URL}/content/search?query=${encodeURIComponent(query)}`);
    return await res.json();
  } catch (error) {
    console.error("Search failed", error);
    return [];
  }
};

// ==========================================
// 🛠️ ADMIN & MANAGEMENT API
// ==========================================

export const triggerSync = async () => {
  try {
    const res = await fetch(`${API_URL}/sync`);
    return await res.json();
  } catch (error) {
    console.error("Sync failed", error);
  }
};

export const triggerMetadata = async () => {
  try {
    const res = await fetch(`${API_URL}/metadata/fetch`);
    return await res.json();
  } catch (error) {
    console.error("Metadata fetch failed", error);
  }
};

export const fetchStats = async () => {
  try {
    const res = await fetch(`${API_URL}/admin/stats`);
    return await res.json();
  } catch (error) {
    return { totalMovies: 0, totalSeries: 0 };
  }
};

export const updateContent = async (id: string, updates: any) => {
  const res = await fetch(`${API_URL}/admin/content/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates),
    credentials: "include",
  });
  return res.json();
};

export const deleteContent = async (id: string) => {
  const res = await fetch(`${API_URL}/admin/content/${id}`, {
    method: "DELETE",
    credentials: "include",
  });
  return res.json();
};

// ==========================================
// 📩 REQUESTS API
// ==========================================

export const submitRequest = async (data: any) => {
  const res = await fetch(`${API_URL}/content/request`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
};

export const fetchRequests = async () => {
  try {
    const res = await fetch(`${API_URL}/admin/requests`, { credentials: "include" });
    return await res.json();
  } catch (error) {
    return [];
  }
};

export const updateRequestStatus = async (id: string, status: string) => {
  const res = await fetch(`${API_URL}/admin/requests/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
    credentials: "include",
  });
  return res.json();
};