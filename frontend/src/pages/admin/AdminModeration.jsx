// AdminModeration.jsx
import { useState } from "react";
import api from "../../api/axios";

export default function AdminModeration() {
  const [doubtId, setDoubtId] = useState("");
  const [responses, setResponses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const loadResponses = async () => {
    setMsg("");
    if (!doubtId) return;
    try {
      setLoading(true);
      const res = await api.get(`/doubts/${doubtId}/responses`);
      setResponses(res.data.data || []);
    } catch (e) {
      setMsg(e?.response?.data?.message || "Failed to load responses");
    } finally {
      setLoading(false);
    }
  };

  const flagResponse = async (respId) => {
    setMsg("");
    try {
      await api.post(`/admin/responses/${respId}/flag`);
      setResponses((prev) => prev.filter((r) => r._id !== respId));
      setMsg("Response removed");
    } catch (e) {
      setMsg(e?.response?.data?.message || "Failed to flag response");
    }
  };

  return (
    <section>
      <h3 className="mb-4 text-xl font-semibold">Moderation</h3>

      <div className="mb-4 flex items-center gap-2">
        <input
          value={doubtId}
          onChange={(e) => setDoubtId(e.target.value)}
          placeholder="Doubt ID"
          className="h-9 w-80 rounded border border-gray-300 px-3 text-sm"
        />
        <button
          onClick={loadResponses}
          className="h-9 rounded bg-blue-600 px-3 text-sm font-medium text-white hover:bg-blue-700"
        >
          Load responses
        </button>
      </div>

      {loading && <div className="text-gray-500">Loading…</div>}
      {msg && <div className="mb-3 text-sm text-gray-700">{msg}</div>}

      <div className="space-y-3">
        {responses.map((r) => (
          <div key={r._id} className="rounded border p-3">
            <div className="mb-1 flex items-center justify-between">
              <div className="text-sm font-medium">
                {r.author?.username || "Unknown"} ({r.author?.role})
              </div>
              <button
                onClick={() => flagResponse(r._id)}
                className="rounded border border-red-200 px-2 py-1 text-xs text-red-700 hover:bg-red-50"
              >
                Remove
              </button>
            </div>
            <p className="whitespace-pre-wrap text-sm text-gray-800">
              {r.content}
            </p>
            {Array.isArray(r.attachments) && r.attachments.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {r.attachments.map((a, idx) => (
                  <a
                    key={idx}
                    href={a.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-blue-700 underline"
                  >
                    {a.type || "attachment"}
                  </a>
                ))}
              </div>
            )}
          </div>
        ))}
        {!responses.length && !loading && (
          <div className="rounded border p-6 text-center text-gray-500">
            No responses loaded yet
          </div>
        )}
      </div>
    </section>
  );
}
