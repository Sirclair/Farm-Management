import axios from "axios";

// Base URL points to the root of your PythonAnywhere backend
const BASE_URL = "https://clair.pythonanywhere.com";

// Create axios instance
const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
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

    // If token expired (401) and we haven't retried this specific request yet
    if (
      error.response &&
      error.response.status === 401 &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem("refresh");
        
        // Note: We use the full path /api/refresh/ here
        const res = await axios.post(`${BASE_URL}/api/refresh/`, {
          refresh: refreshToken,
        });

        const newAccess = res.data.access;
        localStorage.setItem("access", newAccess);

        // Update header and retry the original request
        originalRequest.headers.Authorization = `Bearer ${newAccess}`;
        return api(originalRequest);
      } catch (refreshError) {
        // If refresh fails, the user needs to log in again
        localStorage.removeItem("access");
        localStorage.removeItem("refresh");
        window.location.href = "/auth"; 
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
