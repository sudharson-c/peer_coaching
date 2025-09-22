import { useAuth } from "../context/context";

export default function RoleRoute({ allow, children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return allow.includes(user.role) ? (
    children
  ) : (
    <Navigate to="/dashboard" replace />
  );
}
