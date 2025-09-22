// AdminUsers.jsx
import { useEffect, useMemo, useState } from "react";
import api from "../../api/axios";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [q, setQ] = useState("");
  const [role, setRole] = useState("all");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [busyId, setBusyId] = useState("");

  const load = async () => {
    try {
      setLoading(true);
      const res = await api.get("/admin/all-users");
      setUsers(res.data.data || []);
    } catch (e) {
      setErr(e?.response?.data?.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    return users.filter((u) => {
      const matchRole = role === "all" ? true : u.role === role;
      const matchQ =
        !q ||
        u.username?.toLowerCase().includes(q.toLowerCase()) ||
        u.email?.toLowerCase().includes(q.toLowerCase());
      return matchRole && matchQ;
    });
  }, [users, q, role]);

  const promote = async (id) => {
    setBusyId(id);
    try {
      await api.put(`/admin/add-mentor/${id}`);
      await load();
    } catch (e) {
      setErr(e?.response?.data?.message || "Failed to promote user");
    } finally {
      setBusyId("");
    }
  };

  const removeUser = async (id) => {
    if (!confirm("Delete this user?")) return;
    setBusyId(id);
    try {
      await api.delete(`/admin/users/${id}`);
      setUsers((prev) => prev.filter((u) => u._id !== id));
    } catch (e) {
      setErr(e?.response?.data?.message || "Failed to delete user");
    } finally {
      setBusyId("");
    }
  };

  return (
    <section>
      <header className="mb-4 flex items-center justify-between">
        <h3 className="text-xl font-semibold">Users</h3>
        <div className="flex items-center gap-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search name or email"
            className="h-9 w-64 rounded border border-gray-300 px-3 text-sm"
          />
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="h-9 rounded border border-gray-300 px-2 text-sm"
          >
            <option value="all">All roles</option>
            <option value="student">Student</option>
            <option value="mentor">Mentor</option>
            <option value="admin">Admin</option>
          </select>
        </div>
      </header>

      {loading ? (
        <div className="text-gray-500">Loading users…</div>
      ) : err ? (
        <div className="text-red-600">{err}</div>
      ) : (
        <div className="overflow-x-auto rounded border">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-left text-gray-600">
              <tr>
                <th className="px-3 py-2">Name</th>
                <th className="px-3 py-2">Email</th>
                <th className="px-3 py-2">Role</th>
                <th className="px-3 py-2">Reputation</th>
                <th className="px-3 py-2">Joined</th>
                <th className="px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u._id} className="border-t">
                  <td className="px-3 py-2">{u.username}</td>
                  <td className="px-3 py-2">{u.email}</td>
                  <td className="px-3 py-2">
                    <span className="rounded bg-gray-100 px-2 py-1 text-xs font-medium">
                      {u.role}
                    </span>
                  </td>
                  <td className="px-3 py-2">{u.reputation ?? 0}</td>
                  <td className="px-3 py-2">
                    {u.createdAt
                      ? new Date(u.createdAt).toLocaleDateString()
                      : "-"}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      {u.role !== "mentor" && u.role !== "admin" && (
                        <button
                          onClick={() => promote(u._id)}
                          disabled={busyId === u._id}
                          className="rounded bg-blue-600 px-2 py-1 text-xs text-white hover:bg-blue-700 disabled:opacity-50"
                        >
                          Promote to mentor
                        </button>
                      )}
                      {u.role !== "admin" && (
                        <button
                          onClick={() => removeUser(u._id)}
                          disabled={busyId === u._id}
                          className="rounded border border-red-200 px-2 py-1 text-xs text-red-700 hover:bg-red-50 disabled:opacity-50"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {!filtered.length && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-3 py-8 text-center text-gray-500"
                  >
                    No users match your filters
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
