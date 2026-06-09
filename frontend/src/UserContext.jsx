import { createContext, useState, useEffect } from 'react';
import api from './api/axios';

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const verifyUser = async () => {
    const token = localStorage.getItem('access');
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      // Hits the current_user Django view which now passes the full UserProfileSerializer payload
      const res = await api.get('/api/my-farm/accounts/me/');
      setUser(res.data);
    } catch (err) {
      if (err.response?.status !== 401) {
        console.error('Verify failed:', err);
      }
      localStorage.removeItem('access');
      localStorage.removeItem('refresh'); // Clean up refresh token as well on failure
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    verifyUser();
  }, []);

  return (
    <UserContext.Provider value={{ user, setUser, loading, setLoading }}>
      {children}
    </UserContext.Provider>
  );
};
