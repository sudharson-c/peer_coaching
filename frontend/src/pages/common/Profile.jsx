import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/context";
import api from "../../api/axios";

export default function Profile() {
  const { user, authLoading } = useAuth();
  const [responses, setResponses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const loadResponses = async () => {
    try {
      setLoading(true);
      // backend: implement GET /responses/user/:id?page=&limit=
      const res = await api.get(`/response/user/${user.id}`);
      setResponses(res.data.data.items || res.data.data || []);
    } catch (e) {
      setErr(e?.response?.data?.message || "Failed to load responses");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading) return;
    if (!user?.id) return;
    loadResponses();
  }, [authLoading, user?.id]);

  if (authLoading) return <div className="p-4">Loading…</div>;

  return (
    <section className="mx-auto max-w-3xl px-4 py-6">
      <h1 className="text-2xl font-semibold mb-4">Profile</h1>

      <div className="space-y-1">
        <p>Register Number: {user.username}</p>
        <p>Email: {user.email}</p>
        <p>Role: {user.role}</p>
        <p>Reputation: {user.reputation} ⚡️</p>
      </div>

      <hr className="my-6" />

      <h2 className="text-lg font-semibold mb-2">Your Responses</h2>
      {err && <div className="text-red-600 mb-2">{err}</div>}
      {loading ? (
        <div>Loading responses…</div>
      ) : responses.length === 0 ? (
        <div className="text-gray-600">No responses yet.</div>
      ) : (
        <ul className="space-y-2">
          {responses.map((r) => (
            <li key={r._id} className="rounded border p-3">
              <div className="text-sm text-gray-700 line-clamp-2">
                {r.content}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Likes: {r.likes || 0}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
