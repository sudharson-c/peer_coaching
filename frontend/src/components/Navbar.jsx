// Navbar.jsx
import { NavLink, Link } from "react-router-dom";
import { useAuth } from "../context/context";

const baseLink = "px-3 py-2 rounded-md text-sm font-medium transition-colors";
const inactive = "text-gray-600 hover:text-gray-900 hover:bg-gray-100";
const active = "text-blue-700 bg-blue-50";

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-40 border-b bg-white/80 backdrop-blur">
      <div className="mx-auto max-w-6xl px-4">
        <div className="flex h-14 items-center justify-between">
          <Link
            to={user ? "/dashboard" : "/login"}
            className="text-lg font-semibold tracking-tight text-gray-900"
          >
            Peer Coaching
          </Link>

          <nav className="flex items-center gap-1">
            {user ? (
              <>
                <NavLink
                  to="/dashboard"
                  className={({ isActive }) =>
                    `${baseLink} ${isActive ? active : inactive}`
                  }
                >
                  Dashboard
                </NavLink>
                <NavLink
                  to="/dashboard/doubts"
                  className={({ isActive }) =>
                    `${baseLink} ${isActive ? active : inactive}`
                  }
                >
                  Doubts
                </NavLink>
                <NavLink
                  to="/dashboard/notifications"
                  className={({ isActive }) =>
                    `${baseLink} ${isActive ? active : inactive}`
                  }
                >
                  Notifications
                </NavLink>

                {user.role === "admin" && (
                  <NavLink
                    to="/admin/dashboard"
                    className={({ isActive }) =>
                      `${baseLink} ${isActive ? active : inactive}`
                    }
                  >
                    Admin
                  </NavLink>
                )}

                <span className="ml-2 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium uppercase tracking-wide text-gray-700">
                  {user.role}
                </span>

                <button
                  onClick={logout}
                  className="ml-2 rounded-md border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <NavLink
                  to="/login"
                  className={({ isActive }) =>
                    `${baseLink} ${isActive ? active : inactive}`
                  }
                >
                  Login
                </NavLink>
                <NavLink
                  to="/register"
                  className={({ isActive }) =>
                    `${baseLink} ${isActive ? active : inactive}`
                  }
                >
                  Register
                </NavLink>
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
