// context/AuthContext.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import { AuthContext } from "./context";

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  const login = async (email, password) => {
    const res = await api.post("auth/login", { email, password });
    if (res.data.success) {
      const { token, user } = res.data.data;
      localStorage.setItem("token", token);
      setUser(user);
      if (user.role === "admin") navigate("/admin");
      else navigate("/dashboard");
    } else {
      alert(res.data?.message || "Login failed");
    }
  };

  const register = async (username, email, password) => {
    const res = await api.post("auth/register", { username, email, password });
    if (res.data.success) {
      const { token, user } = res.data.data;
      localStorage.setItem("token", token);
      setUser(user);
      if (user.role === "admin") navigate("/admin");
      else navigate("/dashboard");
    } else {
      alert(res.data?.message || "Registration failed");
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
