import axios from 'axios';

const getBaseURL = () => {
  const url = import.meta.env.VITE_API_URL || 'http://localhost:8000';

  return url.endsWith('/') ? url.slice(0, -1) : url;
};

const BASE_URL = getBaseURL();

// ======================================
// AXIOS INSTANCE
// ======================================

const api = axios.create({
  baseURL: BASE_URL,

  headers: {
    'Content-Type': 'application/json',
  },
});

// ======================================
// REQUEST INTERCEPTOR
// ======================================

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');

    const farmId = localStorage.getItem('active_farm');

    if (token) {
      config.headers.Authorization = `Token ${token}`;
    }

    if (farmId) {
      config.headers['X-FARM-ID'] = farmId;
    }

    return config;
  },

  (error) => Promise.reject(error)
);

// ======================================
// RESPONSE INTERCEPTOR
// ======================================

let redirecting = false;

api.interceptors.response.use(
  (response) => response,

  async (error) => {
    const status = error?.response?.status;

    const url = error?.config?.url || '';

    console.log('API ERROR:', status, url);

    // server offline
    if (!error.response) {
      return Promise.reject(error);
    }

    // session expired
    if (status === 401 && url.includes('/accounts/me/')) {
      if (!redirecting) {
        redirecting = true;

        localStorage.removeItem('token');

        localStorage.removeItem('active_farm');

        localStorage.removeItem('user');

        delete api.defaults.headers.common.Authorization;

        setTimeout(() => {
          window.location.href = '/login';
        }, 100);
      }
    }

    // invalid farm
    if (status === 403) {
      const message = error.response?.data?.error;

      if (message?.includes('farm')) {
        localStorage.removeItem('active_farm');
      }
    }

    return Promise.reject(error);
  }
);

export default api;
