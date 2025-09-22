// AdminDashboard.jsx
import { NavLink, Outlet } from "react-router-dom";

export default function AdminDashboard() {
  const base = "px-3 py-2 rounded-md text-sm font-medium transition-colors";
  const off = "text-gray-600 hover:text-gray-900 hover:bg-gray-100";
  const on = "text-blue-700 bg-blue-50";

  return (
    <div className="flex h-[calc(100vh-56px)]">
      <aside className="w-64 shrink-0 border-r bg-white">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">Admin</h2>
          <p className="text-xs text-gray-500">Moderation & analytics</p>
        </div>
        <nav className="p-3 flex flex-col gap-1">
          <NavLink
            to="/admin/users"
            className={({ isActive }) => `${base} ${isActive ? on : off}`}
          >
            Users
          </NavLink>
          <NavLink
            to="/admin/doubts"
            className={({ isActive }) => `${base} ${isActive ? on : off}`}
          >
            Doubts
          </NavLink>
          <NavLink
            to="/admin/moderation"
            className={({ isActive }) => `${base} ${isActive ? on : off}`}
          >
            Moderation
          </NavLink>
        </nav>
      </aside>

      <main className="flex-1 overflow-auto">
        <div className="mx-auto max-w-6xl p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
