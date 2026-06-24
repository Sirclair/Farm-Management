import { createContext, useState, useEffect, useCallback } from 'react';

import api from './api/axios';

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  const [farms, setFarms] = useState([]);

  const [activeFarm, setActiveFarm] = useState(null);

  const [loading, setLoading] = useState(true);

  // ===========================
  // RESTORE SESSION
  // ===========================

  const restoreSession = useCallback(async () => {
    try {
      setLoading(true);

      const token = localStorage.getItem('token');

      if (!token) {
        setUser(null);

        setFarms([]);

        setActiveFarm(null);

        return;
      }

      api.defaults.headers.common.Authorization = `Token ${token}`;

      const res = await api.get('/api/my-farm/accounts/me/');

      const data = res.data;

      setUser(data.user || null);

      setFarms(data.farms || []);

      setActiveFarm(data.active_farm || null);

      localStorage.setItem(
        'user',

        JSON.stringify(data.user)
      );

      localStorage.setItem(
        'farms',

        JSON.stringify(data.farms || [])
      );

      if (data.active_farm) {
        localStorage.setItem(
          'active_farm',

          String(data.active_farm)
        );
      }

      console.log('SESSION RESTORED');
    } catch (err) {
      console.error(
        'SESSION ERROR:',

        err?.response?.status
      );

      if (err?.response?.status === 401 || err?.response?.status === 403) {
        localStorage.removeItem('token');

        localStorage.removeItem('user');

        localStorage.removeItem('farms');

        localStorage.removeItem('active_farm');

        delete api.defaults.headers.common.Authorization;

        setUser(null);

        setFarms([]);

        setActiveFarm(null);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  // ===========================
  // LOGOUT
  // ===========================

  const logout = () => {
    localStorage.removeItem('token');

    localStorage.removeItem('user');

    localStorage.removeItem('farms');

    localStorage.removeItem('active_farm');

    delete api.defaults.headers.common.Authorization;

    setUser(null);

    setFarms([]);

    setActiveFarm(null);
  };

  return (
    <UserContext.Provider
      value={{
        user,

        setUser,

        farms,

        setFarms,

        activeFarm,

        setActiveFarm,

        loading,

        logout,

        restoreSession,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};
