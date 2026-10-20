//src/context/UseContext.jsx

import { createContext, useEffect, useRef, useState } from "react";

const API_URL = import.meta.env.VITE_API_URL;

export const UserContext = createContext();

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const attempted = useRef(false);
  const api = API_URL || "http://localhost:3000/api";
  const request = async (path, options = {}) => {
    const response = await fetch(`${api}${path}`, { credentials: "include", headers: { "Content-Type": "application/json", ...(options.headers || {}) }, ...options });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.message || "Request failed");
    return data;
  };
  useEffect(() => { if (attempted.current) return; attempted.current = true; request("/auth/me").then(({ user: activeUser }) => setUser(activeUser)).catch(() => setUser(null)).finally(() => setLoading(false)); }, []);
  const login = async (identity, password) => { const data = await request("/auth/login", { method: "POST", body: JSON.stringify({ identity, password }) }); setUser(data.user); return data.user; };
  const logout = async () => { try { await request("/auth/logout", { method: "POST" }); } finally { setUser(null); } };
  return <UserContext.Provider value={{ user, loading, login, logout, request }}>{children}</UserContext.Provider>;
}
