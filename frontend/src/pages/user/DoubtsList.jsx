// DoubtsList.jsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/axios";

export default function DoubtsList() {
  const [doubts, setDoubts] = useState([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const res = await api.get("/doubts");
        if (mounted) setDoubts(res.data.data || []);
      } catch (e) {
        setErr(e?.response?.data?.message || "Failed to load doubts");
      } finally {
        setLoading(false);
      }
    })();
    return () => (mounted = false);
  }, []);

  const filtered = doubts.filter(
    (d) =>
      !q ||
      d.title?.toLowerCase().includes(q.toLowerCase()) ||
      d.description?.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <section>
      <header className="mb-4 flex flex-col md:flex-row items-center justify-between">
        <h3 className="text-xl font-semibold p-2">Doubts</h3>
        <div className="flex flex-col md:flex-row items-center gap-2">
          <div>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search title or description"
              className="h-9 w-72 rounded border border-gray-300 px-3 text-sm"
            />
          </div>
          <Link
            to="/dashboard/new"
            className=" rounded bg-blue-600 text-sm md:text-md p-2 w-full text-white hover:bg-blue-700 text-center"
          >
            + New doubt
          </Link>
        </div>
      </header>

      {loading ? (
        <div className="text-gray-500">Loading…</div>
      ) : err ? (
        <div className="text-red-600">{err}</div>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {filtered.map((d) => (
            <Link
              key={d._id}
              to={`/dashboard/doubts/${d._id}`}
              className="rounded border p-4 hover:shadow-sm"
            >
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
                By {d.postedBy?.username || "Unknown"} •{" "}
                {new Date(d.createdAt).toLocaleString()}
              </p>
              <div className="mt-2 text-xs text-gray-600">
                Tags: {Array.isArray(d.tags) ? d.tags.join(", ") : "-"}
              </div>
            </Link>
          ))}
          {!filtered.length && (
            <div className="col-span-full rounded border p-6 text-center text-gray-500">
              No doubts found
            </div>
          )}
        </div>
      )}
    </section>
  );
}
