// src/components/Navbar.jsx
import { useEffect, useRef, useState } from "react";
import { NavLink, Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/context";

const baseLink = "px-3 py-2 rounded-md text-sm font-medium transition-colors";
const inactive = "text-gray-600 hover:text-gray-900 hover:bg-gray-100";
const active = "text-blue-700 bg-blue-50";

export default function Navbar() {
  const { user, logout, isVerified } = useAuth();
  const [open, setOpen] = useState(false);
  const loc = useLocation();
  const menuRef = useRef(null);
  const btnRef = useRef(null);

  // close on route change
  useEffect(() => {
    setOpen(false);
  }, [loc.pathname]);

  // close on outside click or Escape
  useEffect(() => {
    if (!open) return;
    const onDown = (e) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target) &&
        btnRef.current &&
        !btnRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    };
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const AuthLinks = () => (
    <>
      <NavLink
        to="/dashboard"
        end
        className={({ isActive }) =>
          `${baseLink} ${isActive ? active : inactive}`
        }
      >
        Dashboard
      </NavLink>
      <NavLink
        to="/dashboard/new"
        className={({ isActive }) =>
          `${baseLink} ${isActive ? active : inactive}`
        }
      >
        New doubt
      </NavLink>
      <NavLink
        to="/dashboard/notifications"
        className={({ isActive }) =>
          `${baseLink} ${isActive ? active : inactive}`
        }
      >
        Notifications
      </NavLink>
      <NavLink
        to="/training"
        className={({ isActive }) =>
          `${baseLink} ${isActive ? active : inactive}`
        }
      >
        Placement Preparation
      </NavLink>
      <NavLink
        to="/profile"
        className={({ isActive }) =>
          `${baseLink} ${isActive ? active : inactive}`
        }
      >
        Profile
      </NavLink>

      {user?.role === "admin" && (
        <>
          <div className="mt-2 text-xs font-semibold text-gray-500 md:hidden">
            Admin
          </div>
          <NavLink
            to="/admin/users"
            className={({ isActive }) =>
              `${baseLink} ${isActive ? active : inactive}`
            }
          >
            Users
          </NavLink>
          <NavLink
            to="/admin/doubts"
            className={({ isActive }) =>
              `${baseLink} ${isActive ? active : inactive}`
            }
          >
            Doubts
          </NavLink>
          <NavLink
            to="/admin/moderation"
            className={({ isActive }) =>
              `${baseLink} ${isActive ? active : inactive}`
            }
          >
            Moderation
          </NavLink>
        </>
      )}
    </>
  );

  return (
    <header className="sticky inset-x-0 top-0 z-50 border-b bg-white/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link
          to={user ? "/dashboard" : "/login"}
          className="text-lg font-semibold tracking-tight text-gray-900 flex gap-2"
        >
          <img src="/logo.png" alt="" width={"30px"} height={"40px"} />
          Peer Coaching
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-2 md:flex">
          {user ? (
            <>
              {isVerified && <AuthLinks />}
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

        {/* Mobile trigger */}
        <div className="md:hidden">
          {user ? (
            <button
              ref={btnRef}
              onClick={() => setOpen((v) => !v)}
              className="rounded border px-3 py-1.5 text-sm"
              aria-label="Toggle menu"
              aria-expanded={open}
            >
              Menu
            </button>
          ) : (
            <Link to="/login" className="rounded border px-3 py-1.5 text-sm">
              Login
            </Link>
          )}
        </div>
      </div>

      {/* Mobile dropdown (below navbar) */}
      {open && user && (
        <>
          {/* Click-capture backdrop without dimming */}
          <div
            className="fixed inset-0 z-40 md:hidden"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div className="fixed top-14 inset-x-0 z-50 md:hidden">
            <div className="mx-auto max-w-6xl px-4">
              <div
                ref={menuRef}
                className="overflow-hidden rounded-md border bg-white shadow-lg"
              >
                <div className="flex items-center justify-between border-b p-3">
                  <div className="text-sm">
                    <div className="font-semibold">{user.username}</div>
                    <div className="text-xs text-gray-500 uppercase">
                      {user.role}
                    </div>
                  </div>
                  <button
                    onClick={() => setOpen(false)}
                    className="rounded border px-2 py-1 text-sm"
                    aria-label="Close menu"
                  >
                    Close
                  </button>
                </div>
                <nav className="flex flex-col gap-1 p-3">
                  {isVerified && <AuthLinks />}
                  <button
                    onClick={logout}
                    className="mt-2 rounded border px-3 py-2 text-left text-sm hover:bg-gray-50"
                  >
                    Logout
                  </button>
                </nav>
              </div>
            </div>
          </div>
        </>
      )}
    </header>
  );
}
