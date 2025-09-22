import React, { useState } from "react";
import { useAuth } from "../../context/context";
import { useEffect } from "react";

const Login = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const checkEmail = (email) => {
    const re = /^[a-z._%+-]+@student\.tce\.edu$/i;
    return re.test(email);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!checkEmail(email)) {
      setError("Please use your institutional email.");
      return;
    }

    await login(email, password).catch((err) => {
      setError(err?.response?.data?.message || "Login failed");
    });
  };

  useEffect(() => {
    setTimeout(() => setError(""), 3000);
  }, [error]);

  return (
    <div className="flex h-screen items-center justify-center bg-gray-100">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded-lg shadow-md w-80"
      >
        <h2 className="text-2xl font-bold mb-4 text-center">Login</h2>

        {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
        <input
          type="email"
          placeholder="Email (your-name@student.tce.edu)"
          className="border p-2 w-full mb-3 rounded"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoSave="email"
        />

        <input
          type="password"
          placeholder="Password"
          className="border p-2 w-full mb-3 rounded"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button
          type="submit"
          className="bg-blue-600 text-white w-full py-2 rounded hover:bg-blue-700"
        >
          Login
        </button>

        <p className="text-sm text-center mt-4">
          Don't have an account?{" "}
          <a href="/register" className="text-blue-500 hover:underline">
            Register
          </a>
        </p>
      </form>
    </div>
  );
};

export default Login;
