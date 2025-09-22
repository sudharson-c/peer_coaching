// DoubtDetail.jsx
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import ResponseComposer from "./ResponseComposer";
import api from "../../api/axios";

export default function DoubtDetail() {
  const { id } = useParams();
  const [doubt, setDoubt] = useState(null);
  const [responses, setResponses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const load = async () => {
    try {
      setLoading(true);
      setErr("");
      const res = await api.get(`/doubts/${id}`);
      const { doubt, responses } = res.data?.data || {};
      setDoubt(doubt || null);
      setResponses(Array.isArray(responses) ? responses : []);
      console.log(responses);
    } catch (e) {
      setErr(e?.response?.data?.message || "Failed to load doubt");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  return (
    <section>
      {loading ? (
        <div className="text-gray-500">Loading…</div>
      ) : err ? (
        <div className="text-red-600">{err}</div>
      ) : (
        <>
          <header className="mb-4">
            <div className="mb-1 flex items-center justify-between">
              <h3 className="text-xl font-semibold">{doubt.title}</h3>
              <span
                className={`rounded px-2 py-0.5 text-xs ${
                  doubt.status === "resolved"
                    ? "bg-green-50 text-green-700"
                    : "bg-yellow-50 text-yellow-700"
                }`}
              >
                {doubt.status}
              </span>
            </div>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">
              {doubt.description}
            </p>
            <p className="mt-1 text-xs text-gray-500">
              By {doubt.postedBy?.username || "Unknown"} •{" "}
              {new Date(doubt.createdAt).toLocaleString()}
            </p>
          </header>

          <div className="space-y-3">
            {responses.map((r) => (
              <div key={r._id} className="rounded border p-3">
                <div className="mb-1 flex items-center justify-between">
                  <div className="text-sm font-medium flex items-center gap-2">
                    <span>{r.author?.username || "Unknown"}</span>
                    {r.isByMentor && (
                      <span className="rounded bg-purple-50 px-2 py-0.5 text-[10px] font-semibold text-purple-700">
                        MENTOR
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-gray-500">
                    {new Date(r.createdAt).toLocaleString()}
                  </span>
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
            {!responses.length && (
              <div className="rounded border p-6 text-center text-gray-500">
                No responses yet
              </div>
            )}
          </div>

          <div className="mt-6">
            <ResponseComposer doubtId={id} onPosted={load} />
          </div>
        </>
      )}
    </section>
  );
}
