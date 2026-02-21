"use client";

import { useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "filmi_comment_delete_tokens"; // { [commentId]: token }

function readTokenMap() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}

export default function CommentsClient({ initialComments = [] }) {
  const [comments, setComments] = useState(initialComments);
  const [tokenMap, setTokenMap] = useState({});

  // load tokens
  useEffect(() => {
    setTokenMap(readTokenMap());
  }, []);

  // keep comments in sync when server refresh sends new initialComments
  useEffect(() => {
    setComments(initialComments);
  }, [initialComments]);

  async function handleDelete(commentId) {
    const token = tokenMap[String(commentId)];
    if (!token) return;

    const ok = confirm("Delete this comment?");
    if (!ok) return;

    const res = await fetch(`/api/comments/${commentId}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ deleteToken: token }),
    });

    const json = await res.json().catch(() => null);

    if (!res.ok) {
      alert(json?.error || `Delete failed (${res.status})`);
      return;
    }

    // remove from UI
    setComments((prev) => prev.filter((c) => String(c.id) !== String(commentId)));

    // remove token from storage map
    const next = { ...tokenMap };
    delete next[String(commentId)];
    setTokenMap(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {}
  }

  if (!comments || comments.length === 0) {
    return (
      <p className="mt-3 text-sm text-muted-foreground">
        ഇതുവരെ comments ഇല്ല.
      </p>
    );
  }

  return (
    <div className="mt-4 grid gap-3">
      {comments.map((c) => {
        const canDelete = !!tokenMap[String(c.id)];
        return (
          <div key={c.id} className="rounded-xl border p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="font-medium truncate">{c.email ?? "Guest"}</p>
                <p className="text-xs text-muted-foreground">
                  {c.created_at ? new Date(c.created_at).toLocaleString() : ""}
                </p>
              </div>

              {canDelete && (
                <button
                  onClick={() => handleDelete(c.id)}
                  className="text-xs underline"
                  title="ഈ browser-ൽ നിന്നുള്ള comment ആയാൽ മാത്രം delete പറ്റും"
                >
                  Delete
                </button>
              )}
            </div>

            <p className="mt-2 whitespace-pre-wrap text-sm">{c.body}</p>
          </div>
        );
      })}
    </div>
  );
}
