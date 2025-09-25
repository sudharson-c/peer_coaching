// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { useAuth } from "./context/context";
import Navbar from "./components/Navbar";

// Auth
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";

// Dashboard shells
import Dashboard from "./pages/dashboard/Dashboard";
import AdminDashboard from "./pages/dashboard/AdminDashboard";

// User pages
import DoubtsList from "./pages/user/DoubtsList";
import DoubtDetail from "./pages/user/DoubtDetail";
import CreateDoubt from "./pages/user/CreateDoubt";
import Notifications from "./pages/user/Notifications";

// Admin pages
import AdminUsers from "./pages/admin/AdminUsers";
import AdminDoubts from "./pages/admin/AdminDoubts";
import AdminModeration from "./pages/admin/AdminModeration";
import VerifyEmail from "./components/VerifyEmail";

function ProtectedRoute({ children }) {
  const { user, authLoading, isVerified } = useAuth();
  if (authLoading) return <div className="p-6 text-gray-500">Loading…</div>;
  if (!isVerified && user) return <Navigate to="/verify-email" replace />;
  return user ? children : <Navigate to="/login" replace />;
}
function RoleRoute({ allow, children }) {
  const { user, authLoading } = useAuth();
  if (authLoading) return <div className="p-6 text-gray-500">Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;
  return allow.includes(user.role) ? (
    children
  ) : (
    <Navigate to="/dashboard" replace />
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Navbar />

        <Routes>
          {/* Public */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify-email" element={<VerifyEmail />} />

          {/* Student+Mentor */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          >
            <Route index element={<DoubtsList />} />
            <Route path="doubts/:id" element={<DoubtDetail />} />
            <Route path="new" element={<CreateDoubt />} />
            <Route path="notifications" element={<Notifications />} />
          </Route>

          {/* Admin */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <RoleRoute allow={["admin"]}>
                  <AdminDashboard />
                </RoleRoute>
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="users" replace />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="doubts" element={<AdminDoubts />} />
            <Route path="moderation" element={<AdminModeration />} />
          </Route>
          {/* Back-compat */}
          <Route
            path="/admin/dashboard"
            element={<Navigate to="/admin" replace />}
          />

          {/* Defaults */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
