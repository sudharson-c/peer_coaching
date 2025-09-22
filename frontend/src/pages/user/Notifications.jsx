// Notifications.jsx
import { useEffect, useState } from "react";
import api from "../../api/axios";

export default function Notifications() {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const load = async () => {
    try {
      setLoading(true);
      const res = await api.get("/notifications");
      setNotes(res.data.data || []);
    } catch (e) {
      setErr(e?.response?.data?.message || "Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const markRead = async (id) => {
    try {
      await api.post(`/notifications/${id}/read`);
      setNotes((prev) =>
        prev.map((n) => (n._id === id ? { ...n, read: true } : n))
      );
    } catch (_) {
      console.log(_);
    }
  };

  const deleteNotification = async (id) => {
    try {
      await api.delete(`/notifications/${id}`);
      setNotes((prev) => prev.filter((n) => n._id !== id));
    } catch (_) {
      console.log(_);
    }
  };

  return (
    <section>
      <h3 className="mb-4 text-xl font-semibold">Notifications</h3>
      {loading ? (
        <div className="text-gray-500">Loading…</div>
      ) : err ? (
        <div className="text-red-600">{err}</div>
      ) : (
        <div className="space-y-2">
          {notes.map((n) => (
            <div
              key={n._id}
              className="rounded border p-3 flex items-start justify-between"
            >
              <div>
                <div className="text-sm">{n.message}</div>
                <div className="text-xs text-gray-500">
                  {new Date(n.createdAt).toLocaleString()}
                </div>
              </div>
              <div className="ml-4">
                {n.read ? (
                  <div>
                    <span className="rounded bg-gray-100 px-2 py-1 text-[10px] font-medium text-gray-600">
                      READ
                    </span>
                    <button
                      className="rounded-md border border-red-500 text-red-500 hover:text-white hover:bg-red-500 px-2 py-1 text-[12px] ml-2"
                      onClick={() => deleteNotification(n._id)}
                    >
                      Delete
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => markRead(n._id)}
                    className="rounded border border-blue-200 px-2 py-1 text-[12px] text-blue-700 hover:bg-blue-50"
                  >
                    Mark read
                  </button>
                )}
              </div>
            </div>
          ))}
          {!notes.length && (
            <div className="rounded border p-6 text-center text-gray-500">
              No notifications
            </div>
          )}
        </div>
      )}
    </section>
  );
}
