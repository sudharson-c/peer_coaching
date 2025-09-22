// AdminDoubts.jsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";

export default function AdminDoubts() {
  const [doubts, setDoubts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const res = await api.get("/api/v1/admin/doubts");
        if (mounted) setDoubts(res.data.data || []);
      } catch (e) {
        setErr(e?.response?.data?.message || "Failed to load doubts");
      } finally {
        setLoading(false);
      }
    })();
    return () => (mounted = false);
  }, []);

  return (
    <section>
      <header className="mb-4">
        <h3 className="text-xl font-semibold">All Doubts</h3>
      </header>

      {loading ? (
        <div className="text-gray-500">Loading doubts…</div>
      ) : err ? (
        <div className="text-red-600">{err}</div>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {doubts.map((d) => (
            <div key={d._id} className="rounded border p-4">
              <div className="mb-1 flex items-center justify-between">
                <h4 className="font-medium">{d.title}</h4>
                <span
                  className={`rounded px-2 py-0.5 text-xs ${
                    d.status === "resolved"
                      ? "bg-green-50 text-green-700"
                      : "bg-yellow-50 text-yellow-700"
                  }`}
                >
                  {d.status}
                </span>
              </div>
              <p className="text-xs text-gray-500">
                By {d.postedBy?.name || "Unknown"} •{" "}
                {new Date(d.createdAt).toLocaleString()}
              </p>
              <div className="mt-2 flex items-center gap-2">
                <div className="text-xs text-gray-600">
                  Tags: {Array.isArray(d.tags) ? d.tags.join(", ") : "-"}
                </div>
              </div>
              <div className="mt-3">
                <Link
                  to={`/dashboard/doubts/${d._id}`}
                  className="text-blue-700 hover:underline text-sm"
                >
                  Open in student view
                </Link>
              </div>
            </div>
          ))}
          {!doubts.length && (
            <div className="col-span-full rounded border p-6 text-center text-gray-500">
              No doubts found
            </div>
          )}
        </div>
      )}
    </section>
  );
}
