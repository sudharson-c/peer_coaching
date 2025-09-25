// src/pages/training/PlacementPreparation.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../context/context";
import api from "../../api/axios";
import { trainingStatic } from "../../data/trainingStatic";

// Bookmarks (localStorage)
function useBookmarks() {
  const KEY = "pt_bookmarks_v1";
  const [bookmarks, setBookmarks] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(KEY) || "{}");
    } catch {
      return {};
    }
  });
  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(bookmarks));
  }, [bookmarks]);
  const toggle = (url) =>
    setBookmarks((prev) => ({ ...prev, [url]: !prev[url] }));
  const isSaved = (url) => !!bookmarks[url];
  return { toggle, isSaved };
}

// Helpers
function normalizeUrl(url) {
  try {
    const u = new URL(url);
    u.hash = "";
    [
      "utm_source",
      "utm_medium",
      "utm_campaign",
      "utm_term",
      "utm_content",
    ].forEach((p) => u.searchParams.delete(p));
    return u.toString();
  } catch {
    return (url || "").trim();
  }
}
function mergeResources(staticItems, dynamicItems) {
  const map = new Map();
  staticItems.forEach((it) => {
    const key = normalizeUrl(it.url);
    map.set(key, { ...it, _static: true });
  });
  dynamicItems.forEach((it) => {
    const key = normalizeUrl(it.url);
    if (map.has(key)) {
      const cur = map.get(key);
      map.set(key, {
        ...it,
        title: cur.title || it.title,
        note: cur.note || it.note,
        section: cur.section || it.section,
        tags: Array.from(new Set([...(cur.tags || []), ...(it.tags || [])])),
        curated: true,
        _merged: true,
      });
    } else {
      map.set(key, { ...it, _dynamic: true });
    }
  });
  return Array.from(map.values());
}
function getUserId(u) {
  return u?.id || u?._id || null;
}
function getOwnerId(it) {
  return it?.createdBy?._id || it?.createdBy || null;
}

export default function PlacementPreparation() {
  const { user } = useAuth();
  const myId = getUserId(user);
  const role = user?.role;
  const canContribute = role === "mentor" || role === "admin";

  // Data and UI state
  const [dynamicItems, setDynamicItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTags, setActiveTags] = useState(new Set());
  const [showSavedOnly, setShowSavedOnly] = useState(false);

  // Add modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [form, setForm] = useState({
    title: "",
    url: "",
    note: "",
    section: "dsa",
    tags: "",
    company: "",
  });
  const [submitting, setSubmitting] = useState(false);

  // Edit modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({
    title: "",
    url: "",
    note: "",
    section: "dsa",
    tags: "",
    company: "",
  });
  const [savingEdit, setSavingEdit] = useState(false);

  const { toggle: toggleBookmark, isSaved } = useBookmarks();

  // Fetch dynamic resources
  const loadResources = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await api.get("/resources");
      const data = res.data?.data?.items || res.data?.data || [];
      setDynamicItems(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to load resources");
      setDynamicItems([]);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    loadResources();
  }, []);

  // Merge curated + dynamic
  const allItems = useMemo(
    () => mergeResources(trainingStatic, dynamicItems),
    [dynamicItems]
  );

  // Filters
  const allTags = useMemo(() => {
    const s = new Set();
    allItems.forEach((it) => (it.tags || []).forEach((t) => s.add(t)));
    return Array.from(s).sort();
  }, [allItems]);
  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return allItems.filter((it) => {
      if (showSavedOnly && !isSaved(it.url)) return false;
      if (
        activeTags.size > 0 &&
        !(it.tags || []).some((t) => activeTags.has(t))
      )
        return false;
      if (!q) return true;
      const hay = [
        it.title,
        it.note,
        it.section,
        it.company,
        ...(it.tags || []),
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [allItems, searchQuery, activeTags, showSavedOnly, isSaved]);
  const grouped = useMemo(() => {
    const g = {};
    filteredItems.forEach((it) => {
      const sec = it.section || "other";
      if (!g[sec]) g[sec] = [];
      g[sec].push(it);
    });
    Object.keys(g).forEach((sec) => {
      g[sec].sort((a, b) => {
        if (a.curated && !b.curated) return -1;
        if (!a.curated && b.curated) return 1;
        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      });
    });
    return g;
  }, [filteredItems]);

  // Permissions
  const canEdit = (it) => {
    if (!it._id) return false;
    if (role === "admin") return true;
    const owner = getOwnerId(it);
    return (
      role === "mentor" &&
      !it.approved &&
      owner &&
      myId &&
      String(owner) === String(myId)
    );
  };
  const canDelete = (it) => {
    if (!it._id) return false;
    if (role === "admin") return true;
    const owner = getOwnerId(it);
    return (
      role === "mentor" &&
      !it.approved &&
      owner &&
      myId &&
      String(owner) === String(myId)
    );
  };

  // Actions
  const handleResourceClick = async (it) => {
    if (it._id) {
      try {
        await api.post(`/resources/${it._id}/click`);
      } catch {
        console.log("Error");
      }
    }
  };
  const handleSubmitResource = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.url.trim()) return;
    setSubmitting(true);
    try {
      const tags = form.tags
        .split(",")
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean);
      const payload = {
        title: form.title.trim(),
        url: form.url.trim(),
        note: form.note.trim(),
        section: form.section,
        tags,
        company: form.company.trim() || undefined,
      };
      const res = await api.post("/resources", payload);
      const created = res.data?.data;
      if (created) setDynamicItems((prev) => [created, ...prev]);
      else await loadResources();
      setShowAddModal(false);
      setForm({
        title: "",
        url: "",
        note: "",
        section: "dsa",
        tags: "",
        company: "",
      });
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to add resource");
    } finally {
      setSubmitting(false);
    }
  };
  const openEdit = (it) => {
    setEditingId(it._id);
    setEditForm({
      title: it.title || "",
      url: it.url || "",
      note: it.note || "",
      section: it.section || "dsa",
      tags: (it.tags || []).join(", "),
      company: it.company || "",
    });
    setShowEditModal(true);
  };
  const submitEdit = async (e) => {
    e.preventDefault();
    if (!editingId) return;
    setSavingEdit(true);
    try {
      const tagsArr = editForm.tags
        .split(",")
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean);
      const payload = {
        title: editForm.title.trim(),
        url: editForm.url.trim(),
        note: editForm.note.trim(),
        section: editForm.section,
        tags: tagsArr,
        company: editForm.company.trim() || undefined,
      };
      const res = await api.patch(`/resources/${editingId}`, payload);
      const updated = res.data?.data;
      if (updated) {
        setDynamicItems((prev) =>
          prev.map((x) => (String(x._id) === String(editingId) ? updated : x))
        );
      } else {
        await loadResources();
      }
      setShowEditModal(false);
      setEditingId(null);
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to update resource");
    } finally {
      setSavingEdit(false);
    }
  };
  const handleDelete = async (it) => {
    if (!it._id) return;
    const ok = window.confirm("Delete this resource?");
    if (!ok) return;
    try {
      await api.delete(`/resources/${it._id}`);
      setDynamicItems((prev) =>
        prev.filter((x) => String(x._id) !== String(it._id))
      );
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to delete resource");
    }
  };

  return (
    <section className="mx-auto max-w-5xl px-4 py-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Placement Training</h1>
        {canContribute && (
          <button
            onClick={() => setShowAddModal(true)}
            className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            Add Resource
          </button>
        )}
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search resources..."
          className="rounded border px-3 py-2 sm:col-span-2"
        />
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={showSavedOnly}
            onChange={(e) => setShowSavedOnly(e.target.checked)}
          />
          Show saved only
        </label>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {allTags.map((t) => {
          const on = activeTags.has(t);
          return (
            <button
              key={t}
              onClick={() => {
                const next = new Set(activeTags);
                next.has(t) ? next.delete(t) : next.add(t);
                setActiveTags(next);
              }}
              className={`rounded px-2 py-1 text-xs border ${
                on
                  ? "bg-blue-600 text-white border-blue-600"
                  : "hover:bg-gray-50"
              }`}
            >
              #{t}
            </button>
          );
        })}
        {activeTags.size > 0 && (
          <button
            onClick={() => setActiveTags(new Set())}
            className="rounded px-2 py-1 text-xs border hover:bg-gray-50"
          >
            Clear filters
          </button>
        )}
      </div>

      {error && (
        <div className="mt-4 rounded border border-red-300 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {loading && (
        <div className="mt-6 text-center text-gray-600">
          Loading resources...
        </div>
      )}

      <div className="mt-6 space-y-6">
        {Object.keys(grouped).length === 0 ? (
          <div className="text-center text-gray-600 py-8">
            {loading ? "" : "No resources found."}
          </div>
        ) : (
          Object.entries(grouped).map(([section, items]) => (
            <div key={section}>
              <h2 className="text-lg font-semibold capitalize mb-3">
                {section.replace("-", " ")} ({items.length})
              </h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {items.map((it) => (
                  <div
                    key={it._id || it.url}
                    className="rounded border p-4 hover:bg-gray-50"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="font-medium text-gray-900 leading-tight">
                        {it.title}
                      </h3>
                      <div className="flex gap-1">
                        {it.curated && (
                          <span className="rounded bg-green-100 px-2 py-0.5 text-xs text-green-700">
                            Curated
                          </span>
                        )}
                        {it._id && !it.approved && (
                          <span className="rounded bg-yellow-100 px-2 py-0.5 text-xs text-yellow-700">
                            Pending
                          </span>
                        )}
                      </div>
                    </div>
                    {it.note && (
                      <p className="text-sm text-gray-600 mb-3">{it.note}</p>
                    )}
                    <div className="flex flex-wrap gap-1 mb-3">
                      {(it.tags || []).map((t) => (
                        <span
                          key={t}
                          className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-700"
                        >
                          #{t}
                        </span>
                      ))}
                      {it.company && (
                        <span className="rounded bg-purple-100 px-2 py-0.5 text-xs text-purple-700">
                          {it.company}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <a
                        href={it.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => handleResourceClick(it)}
                        className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                      >
                        Open Resource →
                      </a>
                      <div className="flex items-center gap-2">
                        {canEdit(it) && (
                          <button
                            onClick={() => openEdit(it)}
                            className="text-xs border rounded px-2 py-1 hover:bg-gray-100"
                          >
                            Edit
                          </button>
                        )}
                        {canDelete(it) && (
                          <button
                            onClick={() => handleDelete(it)}
                            className="text-xs border rounded px-2 py-1 hover:bg-red-50 text-red-700 border-red-300"
                          >
                            Delete
                          </button>
                        )}
                        <button
                          onClick={() => toggleBookmark(it.url)}
                          className="text-xs border rounded px-2 py-1 hover:bg-gray-100"
                          title={
                            isSaved(it.url) ? "Remove bookmark" : "Bookmark"
                          }
                        >
                          {isSaved(it.url) ? "★ Saved" : "☆ Save"}
                        </button>
                      </div>
                    </div>
                    {it.clicks > 0 && (
                      <div className="text-xs text-gray-500 mt-2">
                        {it.clicks} {it.clicks === 1 ? "view" : "views"}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-lg bg-white p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Add New Resource</h3>
              <button
                onClick={() => setShowAddModal(false)}
                disabled={submitting}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmitResource} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title *
                </label>
                <input
                  value={form.title}
                  onChange={(e) =>
                    setForm((s) => ({ ...s, title: e.target.value }))
                  }
                  className="w-full rounded border px-3 py-2"
                  required
                  disabled={submitting}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  URL *
                </label>
                <input
                  type="url"
                  value={form.url}
                  onChange={(e) =>
                    setForm((s) => ({ ...s, url: e.target.value }))
                  }
                  className="w-full rounded border px-3 py-2"
                  required
                  disabled={submitting}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={form.note}
                  onChange={(e) =>
                    setForm((s) => ({ ...s, note: e.target.value }))
                  }
                  className="w-full rounded border px-3 py-2"
                  disabled={submitting}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Section *
                  </label>
                  <select
                    value={form.section}
                    onChange={(e) =>
                      setForm((s) => ({ ...s, section: e.target.value }))
                    }
                    className="w-full rounded border px-3 py-2"
                    disabled={submitting}
                  >
                    <option value="dsa">DSA</option>
                    <option value="os">Operating Systems</option>
                    <option value="cn">Computer Networks</option>
                    <option value="dbms">DBMS</option>
                    <option value="oops">OOPS</option>
                    <option value="system-design">System Design</option>
                    <option value="interview">Interview</option>
                    <option value="company-wise">Company-wise</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Company
                  </label>
                  <input
                    value={form.company}
                    onChange={(e) =>
                      setForm((s) => ({ ...s, company: e.target.value }))
                    }
                    className="w-full rounded border px-3 py-2"
                    placeholder="e.g., Amazon"
                    disabled={submitting}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tags
                </label>
                <input
                  value={form.tags}
                  onChange={(e) =>
                    setForm((s) => ({ ...s, tags: e.target.value }))
                  }
                  className="w-full rounded border px-3 py-2"
                  placeholder="arrays, dp, graphs"
                  disabled={submitting}
                />
              </div>
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  disabled={submitting}
                  className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  {submitting ? "Adding..." : "Add Resource"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-lg bg-white p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Edit Resource</h3>
              <button
                onClick={() => setShowEditModal(false)}
                disabled={savingEdit}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <form onSubmit={submitEdit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title *
                </label>
                <input
                  value={editForm.title}
                  onChange={(e) =>
                    setEditForm((s) => ({ ...s, title: e.target.value }))
                  }
                  className="w-full rounded border px-3 py-2"
                  required
                  disabled={savingEdit}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  URL *
                </label>
                <input
                  type="url"
                  value={editForm.url}
                  onChange={(e) =>
                    setEditForm((s) => ({ ...s, url: e.target.value }))
                  }
                  className="w-full rounded border px-3 py-2"
                  required
                  disabled={savingEdit}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={editForm.note}
                  onChange={(e) =>
                    setEditForm((s) => ({ ...s, note: e.target.value }))
                  }
                  className="w-full rounded border px-3 py-2"
                  disabled={savingEdit}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Section *
                  </label>
                  <select
                    value={editForm.section}
                    onChange={(e) =>
                      setEditForm((s) => ({ ...s, section: e.target.value }))
                    }
                    className="w-full rounded border px-3 py-2"
                    disabled={savingEdit}
                  >
                    <option value="dsa">DSA</option>
                    <option value="os">Operating Systems</option>
                    <option value="cn">Computer Networks</option>
                    <option value="dbms">DBMS</option>
                    <option value="oops">OOPS</option>
                    <option value="system-design">System Design</option>
                    <option value="interview">Interview</option>
                    <option value="company-wise">Company-wise</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Company
                  </label>
                  <input
                    value={editForm.company}
                    onChange={(e) =>
                      setEditForm((s) => ({ ...s, company: e.target.value }))
                    }
                    className="w-full rounded border px-3 py-2"
                    disabled={savingEdit}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tags
                </label>
                <input
                  value={editForm.tags}
                  onChange={(e) =>
                    setEditForm((s) => ({ ...s, tags: e.target.value }))
                  }
                  className="w-full rounded border px-3 py-2"
                  placeholder="arrays, dp, graphs"
                  disabled={savingEdit}
                />
              </div>
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  disabled={savingEdit}
                  className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  {savingEdit ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
