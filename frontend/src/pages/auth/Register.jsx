import React, { useState } from "react";
import { useAuth } from "../../context/context";
import { useEffect } from "react";

function Register() {
  const { register } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
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
    await register(username, email, password).catch((err) => {
      setError(err?.response?.data?.message || "Registration failed");
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
        <h2 className="text-2xl font-bold mb-4 text-center">Register</h2>

        {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
        <input
          type="username"
          placeholder="Register No / Roll No  (eg: 22ITXXX)"
          className="border p-2 w-full mb-3 rounded"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
        <input
          type="email"
          placeholder="Email (your-name@student.tce.edu)"
          className="border p-2 w-full mb-3 rounded"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
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
          className="bg-green-600 text-white w-full py-2 rounded hover:bg-green-700"
        >
          Register
        </button>

        <p className="text-sm text-center mt-4">
          Already have an account?{" "}
          <a href="/login" className="text-blue-500 hover:underline">
            Login
          </a>
        </p>
      </form>
    </div>
  );
}

export default Register;
