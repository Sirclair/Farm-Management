import axios from 'axios';

const getBaseURL = () => {
  const url = import.meta.env.VITE_API_URL || 'http://localhost:8000/';
  return url.endsWith('/') ? url.slice(0, -1) : url;
};

const BASE_URL = getBaseURL();

/**
 * Main Axios instance
 */
const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// =====================================================
// REQUEST INTERCEPTOR (ATTACH ACCESS TOKEN)
// =====================================================
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// =====================================================
// RESPONSE INTERCEPTOR (AUTO REFRESH TOKEN)
// =====================================================
api.interceptors.response.use(
  (response) => response,

  async (error) => {
    const originalRequest = error.config;

    // If no response (network error)
    if (!error.response) {
      return Promise.reject(error);
    }

    const { status } = error.response;

    // =================================================
    // 1. DO NOT TRY TO REFRESH ON LOGIN REQUESTS
    // =================================================
    if (status === 401 && originalRequest?.url?.includes('login')) {
      return Promise.reject(error);
    }

    // =================================================
    // 2. HANDLE TOKEN REFRESH
    // =================================================
    if (status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refresh');

        if (!refreshToken) {
          throw new Error('No refresh token found');
        }

        // 🔥 IMPORTANT: FIXED ENDPOINT
        const res = await axios.post(`${BASE_URL}/api/token/refresh/`, {
          refresh: refreshToken,
        });

        const newAccessToken = res.data.access;

        // Save new access token
        localStorage.setItem('access', newAccessToken);

        // Update header and retry request
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed → logout user
        localStorage.removeItem('access');
        localStorage.removeItem('refresh');

        window.location.href = '/login';

        return Promise.reject(refreshError);
      }
    }

    // =================================================
    // 3. DEFAULT ERROR HANDLING
    // =================================================
    return Promise.reject(error);
  }
);

export default api;
