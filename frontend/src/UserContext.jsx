import { createContext, useState, useEffect } from "react";
import api from "./api/axios";

export const UserContext = createContext();

export const UserProvider = ({ children }) => {

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const verifyUser = async () => {

    const token = localStorage.getItem("access");

    if (!token) {
      setLoading(false);
      return;
    }

    try {

      const res = await api.get("my-farm/accounts/me/");

      setUser(res.data);

    } catch (err) {

      // Only log unexpected errors
      if (err.response?.status !== 401) {
        console.error("Auth error:", err);
      }

      localStorage.removeItem("access");
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