// src/pages/DoubtDetail.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ResponseComposer from "./ResponseComposer";
import { useAuth } from "../../context/context";
import api from "../../api/axios";

export default function DoubtDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const currentUserId = user?.id || user?._id;
  const isAdmin = user?.role === "admin";

  const [doubt, setDoubt] = useState(null);
  const [responses, setResponses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // Doubt edit state
  const [editingDoubt, setEditingDoubt] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [busyDoubt, setBusyDoubt] = useState(false);

  // Response edit state
  const [editingRespId, setEditingRespId] = useState(null);
  const [editRespContent, setEditRespContent] = useState("");
  const [editRespAttach, setEditRespAtt] = useState("");
  const [busyRespId, setBusyRespId] = useState(null);

  // Local UX controls
  const [liked, setLiked] = useState(false);
  const [acceptingId, setAcceptingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const canManageDoubt = useMemo(() => {
    const postedId = doubt?.postedBy?._id || doubt?.postedBy?.id;
    return !!(
      isAdmin ||
      (postedId && currentUserId && String(postedId) === String(currentUserId))
    );
  }, [doubt, isAdmin, currentUserId]);

  const load = async () => {
    try {
      setLoading(true);
      setErr("");
      const res = await api.get(`/doubts/${id}`);
      const payload = res.data?.data || {};
      const nextDoubt = payload.doubt || null;
      const nextResponses = Array.isArray(payload.responses)
        ? payload.responses
        : [];
      setDoubt(nextDoubt);
      setResponses(nextResponses);
      // seed edit fields
      setEditTitle(nextDoubt?.title || "");
      setEditDesc(nextDoubt?.description || "");
    } catch (e) {
      setErr(e?.response?.data?.message || "Failed to load doubt");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, busyRespId]);

  const likeResponse = async (respId) => {
    // optimistic update
    setResponses((prev) =>
      prev.map((r) =>
        r._id === respId ? { ...r, likes: (r.likes || 0) + 1 } : r
      )
    );
    try {
      await api.post(`/response/${respId}/like`);
    } catch {
      // rollback on failure
      setResponses((prev) =>
        prev.map((r) =>
          r._id === respId
            ? { ...r, likes: Math.max((r.likes || 1) - 1, 0) }
            : r
        )
      );
    } finally {
      setLiked(true);
    }
  };

  const startEditResponse = (r) => {
    setEditingRespId(r._id);
    setEditRespContent(r.content || "");
    setEditRespAtt(r.attachments || "");
  };

  const saveResponse = async (respId) => {
    setBusyRespId(respId);
    try {
      const res = await api.patch(`/response/${respId}`, {
        content: editRespContent,
        attachments: editRespAttach,
      });
      const updated = res.data?.data;
      setResponses((prev) =>
        prev.map((r) => (r._id === respId ? { ...r, ...updated } : r))
      );
      setEditingRespId(null);
      setEditRespContent("");
      setEditRespAtt("");
    } catch (e) {
      // surface minimal error
      alert(e?.response?.data?.message || "Failed to update response");
    } finally {
      setBusyRespId(null);
    }
  };

  const deleteResponse = async (respId) => {
    if (!confirm("Delete this response?")) return;
    setDeletingId(respId);
    try {
      await api.delete(`/response/${respId}`);
      setResponses((prev) => prev.filter((r) => r._id !== respId));
      // if accepted was this response, clear local accepted marker
      if (String(doubt?.resolvedBy) === String(respId)) {
        setDoubt((d) =>
          d ? { ...d, resolvedBy: undefined, status: "open" } : d
        );
      }
    } catch (e) {
      alert(e?.response?.data?.message || "Failed to delete response");
    } finally {
      setDeletingId(null);
    }
  };

  const acceptResponse = async (respId) => {
    if (!canManageDoubt || doubt?.status === "resolved") return;
    setAcceptingId(respId);
    try {
      // Try to set both status and resolvedBy; if server ignores resolvedBy it still resolves
      await api.patch(`/doubts/${id}`, {
        status: "resolved",
        resolvedBy: respId,
      });
      setDoubt((d) =>
        d ? { ...d, status: "resolved", resolvedBy: respId } : d
      );
    } catch (e) {
      alert(e?.response?.data?.message || "Failed to accept response");
    } finally {
      setAcceptingId(null);
    }
  };

  const startEditDoubt = () => {
    setEditingDoubt(true);
    setEditTitle(doubt?.title || "");
    setEditDesc(doubt?.description || "");
  };

  const saveDoubt = async () => {
    setBusyDoubt(true);
    try {
      const res = await api.patch(`/doubts/${id}`, {
        title: editTitle,
        description: editDesc,
      });
      const updated = res.data?.data || {};
      setDoubt((d) => (d ? { ...d, ...updated } : d));
      setEditingDoubt(false);
    } catch (e) {
      alert(e?.response?.data?.message || "Failed to update doubt");
    } finally {
      setBusyDoubt(false);
    }
  };

  const deleteDoubt = async () => {
    if (!confirm("Delete this doubt?")) return;
    setBusyDoubt(true);
    try {
      await api.delete(`/doubts/${id}`);
      navigate("/dashboard");
    } catch (e) {
      alert(e?.response?.data?.message || "Failed to delete doubt");
      setBusyDoubt(false);
    }
  };

  const isEdited = (createdAt, updatedAt) => {
    if (!updatedAt) return false;
    try {
      return new Date(updatedAt).getTime() > new Date(createdAt).getTime();
    } catch {
      return false;
    }
  };

  useEffect(() => {});

  const isRespOwner = (r) => {
    const aid = r?.author?._id || r?.author?.id;
    return !!(
      isAdmin ||
      (aid && currentUserId && String(aid) === String(currentUserId))
    );
  };

  const acceptedId = doubt?.resolvedBy;

  return (
    <section>
      {loading ? (
        <div className="text-gray-500">Loading…</div>
      ) : err ? (
        <div className="text-red-600">{err}</div>
      ) : !doubt ? (
        <div className="text-gray-500">Not found</div>
      ) : (
        <>
          {/* Doubt header */}
          <header className="mb-4">
            {editingDoubt ? (
              <div className="space-y-2 rounded border p-4">
                <input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full rounded border border-gray-300 px-3 py-2"
                  placeholder="Title"
                />
                <textarea
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  rows={5}
                  className="w-full rounded border border-gray-300 px-3 py-2"
                  placeholder="Description"
                />
                <div className="flex gap-2">
                  <button
                    onClick={saveDoubt}
                    disabled={busyDoubt}
                    className="rounded bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setEditingDoubt(false)}
                    className="rounded border px-3 py-2 text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="mb-1 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-semibold">{doubt.title}</h3>
                    {isEdited(doubt.createdAt, doubt.updatedAt) && (
                      <span className="rounded bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                        UPDATED
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded px-2 py-0.5 text-xs ${
                        doubt.status === "resolved"
                          ? "bg-green-50 text-green-700"
                          : "bg-yellow-50 text-yellow-700"
                      }`}
                    >
                      {doubt.status}
                    </span>
                    {canManageDoubt && (
                      <>
                        {doubt.status === "open" && (
                          <span className="text-[11px] text-gray-500">
                            Accept an answer below to resolve
                          </span>
                        )}
                        <button
                          onClick={startEditDoubt}
                          className="rounded border px-2 py-1 text-xs hover:bg-gray-50"
                        >
                          Edit
                        </button>
                        <button
                          onClick={deleteDoubt}
                          disabled={busyDoubt}
                          className="rounded border border-red-200 px-2 py-1 text-xs text-red-700 hover:bg-red-50 disabled:opacity-50"
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </div>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                  {doubt.description}
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  By {doubt.postedBy?.username || "Unknown"} •{" "}
                  {new Date(doubt.createdAt).toLocaleString()}
                </p>
              </>
            )}
          </header>

          {/* Responses */}
          <div className="space-y-3">
            {responses.map((r) => {
              const accepted =
                acceptedId && String(acceptedId) === String(r._id);
              return (
                <div
                  key={r._id}
                  className={`rounded border p-3 ${
                    accepted ? "border-green-300" : ""
                  }`}
                >
                  <div className="mb-1 flex items-center justify-between">
                    <div className="text-sm font-medium flex items-center gap-2">
                      <span>{r.author?.username}</span>
                      {r.isByMentor && (
                        <span className="rounded bg-purple-50 px-2 py-0.5 text-[10px] font-semibold text-purple-700">
                          MENTOR
                        </span>
                      )}
                      {accepted && (
                        <span className="rounded bg-green-50 px-2 py-0.5 text-[10px] font-semibold text-green-700">
                          ACCEPTED
                        </span>
                      )}
                      {isEdited(r.createdAt, r.updatedAt) && (
                        <span className="rounded bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                          UPDATED
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-gray-500">
                        {new Date(r.createdAt).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {editingRespId === r._id ? (
                    <div className="space-y-2">
                      <textarea
                        value={editRespContent}
                        onChange={(e) => setEditRespContent(e.target.value)}
                        rows={4}
                        className="w-full rounded border border-gray-300 px-3 py-2"
                      />
                      <input
                        type="text"
                        value={editRespAttach}
                        onChange={(e) => setEditRespAtt(e.target.value)}
                        rows={4}
                        className="w-full rounded border border-gray-300 px-3 py-2"
                      />

                      <div className="flex gap-2">
                        <button
                          onClick={() => saveResponse(r._id)}
                          disabled={busyRespId === r._id}
                          className="rounded bg-blue-600 px-3 py-1.5 text-xs text-white hover:bg-blue-700 disabled:opacity-50"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => {
                            setEditingRespId(null);
                            setEditRespContent("");
                          }}
                          className="rounded border px-3 py-1.5 text-xs"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="whitespace-pre-wrap text-sm text-gray-800">
                        {r.content}
                      </p>
                      {Array.isArray(r.attachments) &&
                        r.attachments.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {r.attachments.map((a, idx) => (
                              <a
                                key={idx}
                                href={a}
                                target="_blank"
                                rel="noreferrer"
                                className="text-xs text-blue-700 underline"
                              >
                                {a || "attachment"}
                              </a>
                            ))}
                          </div>
                        )}
                    </>
                  )}

                  <div className="mt-3 flex items-center gap-3">
                    <button
                      onClick={() => likeResponse(r._id)}
                      disabled={isRespOwner(r) || liked}
                      className="rounded border px-2 py-1 text-xs hover:bg-gray-50 disabled:opacity-50"
                    >
                      👍 {r.likes || 0}
                    </button>

                    {canManageDoubt && doubt.status === "open" && !accepted && (
                      <button
                        onClick={() => acceptResponse(r._id)}
                        disabled={acceptingId === r._id}
                        className="rounded bg-green-600 px-2 py-1 text-xs text-white hover:bg-green-700 disabled:opacity-50"
                      >
                        Accept
                      </button>
                    )}

                    {isRespOwner(r) && editingRespId !== r._id && (
                      <>
                        <button
                          onClick={() => startEditResponse(r)}
                          className="rounded border px-2 py-1 text-xs hover:bg-gray-50"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deleteResponse(r._id)}
                          disabled={deletingId === r._id}
                          className="rounded border border-red-200 px-2 py-1 text-xs text-red-700 hover:bg-red-50 disabled:opacity-50"
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}

            {!responses.length && (
              <div className="rounded border p-6 text-center text-gray-500">
                No responses yet
              </div>
            )}
          </div>
          {/* Composer */}
          <div className="mt-6">
            {doubt.postedBy._id !== user.id && (
              <ResponseComposer doubtId={id} onPosted={load} />
            )}
          </div>
        </>
      )}
    </section>
  );
}
