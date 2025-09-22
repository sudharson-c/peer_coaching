// App.jsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import Dashboard from "./pages/dashboard/Dashboard";
import AdminDashboard from "./pages/dashboard/AdminDashboard";
import Navbar from "./components/Navbar";
import { AuthProvider } from "./context/AuthContext";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminDoubts from "./pages/admin/AdminDoubts";
import AdminModeration from "./pages/admin/AdminModeration";
import { useAuth } from "./context/context";
import DoubtsList from "./pages/user/DoubtsList";
import DoubtDetail from "./pages/user/DoubtDetail";
import CreateDoubt from "./pages/user/CreateDoubt";
import Notifications from "./pages/user/Notifications";

function ProtectedRoute({ children }) {
  const { user, authLoading } = useAuth();
  if (authLoading) return <div className="p-6 text-gray-500">Loading…</div>;
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

          {/* Student+Mentor dashboard */}
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

          {/* Admin layout + nested pages */}
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

          {/* Legacy redirect */}
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
