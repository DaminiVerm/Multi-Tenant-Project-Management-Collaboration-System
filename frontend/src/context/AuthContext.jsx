import { createContext, useContext, useMemo, useState } from "react";
import api from "../services/api";
const AuthContext = createContext(null);
export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem("user") || "null"); } catch { return null; }
  });
  async function login(email, password, role) {
  const { data } = await api.post("/auth/login", {
    email,
    password,
    role,
  });

  localStorage.setItem("token", data.token);
  localStorage.setItem("user", JSON.stringify(data.user));
  setUser(data.user);
}
  async function register(name, email, password) {
    const { data } = await api.post("/auth/register", { name, email, password });
    localStorage.setItem("token", data.token); localStorage.setItem("user", JSON.stringify(data.user)); setUser(data.user);
  }
  function logout() { localStorage.removeItem("token"); localStorage.removeItem("user"); setUser(null); }
  const value = useMemo(() => ({ user, login, register, logout }), [user]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export const useAuth = () => useContext(AuthContext);
