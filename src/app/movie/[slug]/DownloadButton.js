"use client";

import { useState } from "react";

export default function DownloadButton({ subtitleId, initialDownloads = 0 }) {
  const [loading, setLoading] = useState(false);
  const [downloads, setDownloads] = useState(initialDownloads);

  async function handleDownload() {
    if (!subtitleId) return;

    setLoading(true);
    try {
      const res = await fetch("/api/subtitles/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subtitleId }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "Download failed");

      setDownloads(data.downloads ?? downloads);

      // start download
      window.location.href = data.url;
    } catch (e) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-muted-foreground">Downloads: {downloads}</span>

      <button
        onClick={handleDownload}
        disabled={loading}
        className="rounded-lg border px-3 py-2 text-sm disabled:opacity-60"
      >
        {loading ? "Preparing..." : "Download"}
      </button>
    </div>
  );
}