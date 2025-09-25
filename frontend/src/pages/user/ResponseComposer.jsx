// ResponseComposer.jsx
import { useState } from "react";
import api from "../../api/axios";

export default function ResponseComposer({ doubtId, onPosted }) {
  const [content, setContent] = useState("");
  const [drive, setDrive] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    if (!content.trim()) return setErr("Content required");
    const attachments = drive ? [{ url: drive }] : [];
    try {
      setBusy(true);
      await api.post(`/response/${doubtId}`, {
        content,
        attachments,
      });
      setContent("");
      setDrive("");
      onPosted?.();
    } catch (e) {
      setErr(e?.response?.data?.message || "Failed to post response");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="rounded border p-4 space-y-3">
      <h4 className="font-medium">Add a response</h4>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Write your explanation or notes…"
        rows={4}
        className="w-full rounded border border-gray-300 px-3 py-2"
      />
      <input
        value={drive}
        onChange={(e) => setDrive(e.target.value)}
        placeholder="Google Drive or Resource link  (optional)"
        className="w-full rounded border border-gray-300 px-3 py-2"
      />
      {err && <div className="text-sm text-red-600">{err}</div>}
      <button
        disabled={busy}
        className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
      >
        Post response
      </button>
    </form>
  );
}
