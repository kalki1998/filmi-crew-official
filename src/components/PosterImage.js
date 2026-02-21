"use client";

import { useEffect, useState } from "react";

export default function PosterImage({ posterKey, alt, className = "" }) {
  const [url, setUrl] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!posterKey) return;
      const res = await fetch(`/api/r2/signed-url?key=${encodeURIComponent(posterKey)}`);
      const data = await res.json();
      if (!cancelled && data.ok) setUrl(data.url);
    }

    load();
    return () => { cancelled = true; };
  }, [posterKey]);

  if (!posterKey) return null;

  if (!url) {
    return <div className={`bg-gray-200 animate-pulse rounded ${className}`} />;
  }

  return (
    <img
      src={url}
      alt={alt || "poster"}
      className={`w-full h-auto rounded ${className}`}
      loading="lazy"
    />
  );
}
