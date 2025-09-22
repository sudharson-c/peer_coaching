// CreateDoubt.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";

export default function CreateDoubt() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    if (!title.trim()) return setErr("Title required");
    try {
      setBusy(true);
      await api.post("/doubts", { title, description });
      navigate("/dashboard");
    } catch (e) {
      setErr(e?.response?.data?.message || "Failed to create doubt");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section>
      <h3 className="mb-4 text-xl font-semibold">New doubt</h3>
      <form onSubmit={submit} className="max-w-xl space-y-3">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title"
          className="w-full rounded border border-gray-300 px-3 py-2"
        />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description (optional)"
          rows={5}
          className="w-full rounded border border-gray-300 px-3 py-2"
        />
        {err && <div className="text-sm text-red-600">{err}</div>}
        <button
          disabled={busy}
          className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
        >
          Create
        </button>
      </form>
    </section>
  );
}
