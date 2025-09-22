// context/AuthContext.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import { AuthContext } from "./context";
import { useEffect } from "react";

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;
    const token = localStorage.getItem("token");
    if (!token) {
      setAuthLoading(false);
      return;
    }
    (async () => {
      try {
        // interceptor already adds Authorization
        const res = await api.get("/auth/me");
        if (mounted && res.data?.success) setUser(res.data.data);
      } catch (e) {
        // invalid/expired token -> clear
        console.log(e);
        localStorage.removeItem("token");
        if (mounted) setUser(null);
      } finally {
        if (mounted) setAuthLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

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
    <AuthContext.Provider
      value={{ user, login, register, logout, authLoading }}
    >
      {children}
    </AuthContext.Provider>
  );
};
