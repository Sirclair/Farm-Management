import axios from "axios";

// This helper ensures we don't get double slashes //
const getBaseURL = () => {
  let url = import.meta.env.VITE_API_URL || "https://farm-management-8o37.onrender.com";
  return url.endsWith('/') ? url.slice(0, -1) : url;
};

const BASE_URL = getBaseURL();

const api = axios.create({
  baseURL: BASE_URL, 
  headers: { "Content-Type": "application/json" },
});

// Request interceptor → attach access token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor → auto refresh token if expired
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 Unauthorized (Expired Token)
    if (
      error.response &&
      error.response.status === 401 &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem("refresh");
        
        // Use the instance base URL for refreshing
        const res = await axios.post(`${BASE_URL}/api/refresh/`, {
          refresh: refreshToken,
        });

        const newAccess = res.data.access;
        localStorage.setItem("access", newAccess);

        // Update header and retry the original request
        originalRequest.headers.Authorization = `Bearer ${newAccess}`;
        return api(originalRequest);
      } catch (refreshError) {
        // If refresh fails, clear tokens and redirect to login
        localStorage.removeItem("access");
        localStorage.removeItem("refresh");
        
        // Use your actual login route (e.g., /login or /auth)
        window.location.href = "/login"; 
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
