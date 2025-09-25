// context/AuthContext.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import { AuthContext } from "./context";
import { useEffect } from "react";

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isVerified, setIsVerified] = useState(false);
  const navigate = useNavigate();

  // context/AuthContext.jsx (fix control flow and helpers)
  const login = async (email, password) => {
    const res = await api.post("/auth/login", { email, password });
    if (res.data.success) {
      const { token, user } = res.data.data;
      localStorage.setItem("token", token);
      setUser(user);
      const verified = !!user.isVerified;
      setIsVerified(verified);
      if (!verified) {
        await api.post("/auth/generate-token", { email });
        navigate("/verify-email");
        return; // prevent falling through
      }
      if (user.role === "admin") navigate("/admin");
      else navigate("/dashboard");
    } else {
      alert(res.data?.message || "Login failed");
    }
  };

  const register = async (username, email, password) => {
    const res = await api.post("/auth/register", { username, email, password });
    if (res.data.success) {
      const { token, user } = res.data.data;
      localStorage.setItem("token", token);
      setUser(user);
      const verified = !!user.isVerified;
      setIsVerified(verified);
      if (!verified) {
        await api.post("/auth/generate-token", { email }); // one-time send
        navigate("/verify-email");
        return; // prevent falling through
      }
      if (user.role === "admin") navigate("/admin");
      else navigate("/dashboard");
    } else {
      alert(res.data?.message || "Registration failed");
    }
  };

  const refreshMe = async () => {
    const res = await api.get("/auth/me");
    if (res.data?.success) {
      setUser(res.data.data);
      setIsVerified(!!res.data.data?.isVerified);
      return res.data.data;
    }
    return null;
  };

  useEffect(() => {
    let mounted = true;
    const token = localStorage.getItem("token");
    if (!token) {
      setAuthLoading(false);
      return;
    }
    (async () => {
      try {
        const res = await api.get("/auth/me");
        if (mounted && res.data?.success) {
          setUser(res.data.data);
          setIsVerified(!!res.data.data?.isVerified);
        }
      } catch (e) {
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

  const setVerified = () => setIsVerified(true);

  const logout = () => {
    setUser(null);
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        register,
        logout,
        authLoading,
        isVerified,
        refreshMe,
        setVerified,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
