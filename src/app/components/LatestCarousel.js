"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef } from "react";

function posterSrc(poster_key) {
  if (!poster_key) return null;
  const filename = String(poster_key).split("/").pop();
  return filename ? `/api/uploads/${filename}` : null;
}

function isNew(createdAt, hours = 48) {
  if (!createdAt) return false;
  const t = new Date(createdAt).getTime();
  if (!Number.isFinite(t)) return false;
  return Date.now() - t < hours * 60 * 60 * 1000;
}

export default function LatestCarousel({ items = [] }) {
  const scrollerRef = useRef(null);
  const timerRef = useRef(null);

  // ✅ limit 5–7 (prefer 7, but if less, show what exists)
  const base = useMemo(() => {
    const arr = Array.isArray(items) ? items.slice(0, 7) : [];
    return arr;
  }, [items]);

  // ✅ Infinite loop trick: clone head + tail
  const LOOP_CLONES = 2; // keep small (works even for 5–7)
  const loopItems = useMemo(() => {
    if (base.length === 0) return [];
    if (base.length <= LOOP_CLONES) return base; // edge
    const head = base.slice(0, LOOP_CLONES);
    const tail = base.slice(-LOOP_CLONES);
    return [...tail, ...base, ...head];
  }, [base]);

  // helpers
  function getCardWidth() {
    const el = scrollerRef.current;
    if (!el) return 240;
    const first = el.querySelector("[data-card='1']");
    if (!first) return 240;
    const rect = first.getBoundingClientRect();
    return rect.width + 16; // include gap (gap-4 = 16px)
  }

  function jumpToRealStart() {
    const el = scrollerRef.current;
    if (!el) return;
    if (base.length <= LOOP_CLONES) return;

    const cardW = getCardWidth();
    // start at first real item (after tail clones)
    el.scrollLeft = cardW * LOOP_CLONES;
  }

  function scrollNext() {
    const el = scrollerRef.current;
    if (!el) return;
    const cardW = getCardWidth();
    el.scrollBy({ left: cardW, behavior: "smooth" });
  }

  // ✅ init position
  useEffect(() => {
    // wait a tick so DOM measures exist
    const t = setTimeout(jumpToRealStart, 50);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [base.length]);

  // ✅ infinite loop correction on scroll end
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;

    function onScroll() {
      if (base.length <= LOOP_CLONES) return;

      const cardW = getCardWidth();
      const left = el.scrollLeft;

      const realStart = cardW * LOOP_CLONES;
      const realEnd = cardW * (LOOP_CLONES + base.length);

      // if user scrolls into left clones -> jump to end real
      if (left < realStart - cardW * 0.5) {
        el.scrollLeft = realEnd - cardW * 0.5;
      }

      // if user scrolls into right clones -> jump to start real
      if (left > realEnd + cardW * 0.5) {
        el.scrollLeft = realStart + cardW * 0.5;
      }
    }

    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [base.length]);

  // ✅ auto-scroll (pause on hover)
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    if (base.length < 2) return;

    function start() {
      stop();
      timerRef.current = setInterval(() => {
        // only auto-scroll if user isn't actively scrolling (simple heuristic)
        scrollNext();
      }, 2500);
    }

    function stop() {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
    }

    start();
    el.addEventListener("mouseenter", stop);
    el.addEventListener("mouseleave", start);
    el.addEventListener("touchstart", stop, { passive: true });
    el.addEventListener("touchend", start, { passive: true });

    return () => {
      stop();
      el.removeEventListener("mouseenter", stop);
      el.removeEventListener("mouseleave", start);
      el.removeEventListener("touchstart", stop);
      el.removeEventListener("touchend", start);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [base.length]);

  if (!base.length) {
    return (
      <p className="mt-3 text-sm text-muted-foreground">
        ഇപ്പോൾ latest uploads ഇല്ല.
      </p>
    );
  }

  return (
    <div className="relative mt-3">
      {/* arrows (desktop) */}
      <button
        type="button"
        onClick={() => {
          const el = scrollerRef.current;
          if (!el) return;
          el.scrollBy({ left: -getCardWidth(), behavior: "smooth" });
        }}
        className="hidden sm:grid absolute left-0 top-1/2 -translate-y-1/2 z-10 h-10 w-10 place-items-center rounded-full border bg-background/80 backdrop-blur hover:bg-background"
        aria-label="Scroll left"
      >
        ←
      </button>

      <button
        type="button"
        onClick={() => scrollNext()}
        className="hidden sm:grid absolute right-0 top-1/2 -translate-y-1/2 z-10 h-10 w-10 place-items-center rounded-full border bg-background/80 backdrop-blur hover:bg-background"
        aria-label="Scroll right"
      >
        →
      </button>

      <div
        ref={scrollerRef}
        className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory scroll-smooth px-1"
      >
        {loopItems.map((m, idx) => {
          const src = posterSrc(m.poster_key);
          const badge = isNew(m.created_at, 48);

          return (
            <Link
              key={`${m.id}-${idx}`}
              href={`/movie/${m.slug}`}
              className="snap-start shrink-0 w-[180px] sm:w-[220px] group"
              title={m.title}
              data-card={idx === 0 ? "1" : undefined}
            >
              <div className="rounded-2xl border overflow-hidden bg-background">
                <div className="relative aspect-[2/3] w-full bg-muted">
                  {src ? (
                    <img
                      src={src}
                      alt={`${m.title} poster`}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="h-full w-full grid place-items-center text-xs text-muted-foreground">
                      No Poster
                    </div>
                  )}

                  {/* NEW badge */}
                  {badge && (
                    <div className="absolute left-2 top-2">
                      <span className="rounded-full bg-emerald-600 px-2 py-1 text-[10px] font-semibold text-white shadow">
                        NEW
                      </span>
                    </div>
                  )}

                  {/* hover overlay */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition">
                    <div className="absolute inset-0 bg-black/55" />
                    <div className="absolute bottom-3 left-3 right-3">
                      <p className="text-white text-sm font-semibold line-clamp-2">
                        {m.title}
                      </p>
                      <p className="text-white/80 text-xs">
                        {m.year ?? "—"} • Open →
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-3">
                  <p className="text-sm font-semibold line-clamp-1 group-hover:underline">
                    {m.title}
                  </p>
                  <p className="text-xs text-muted-foreground">{m.year ?? "—"}</p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      <p className="mt-2 text-xs text-muted-foreground sm:hidden">
        Swipe ചെയ്ത് scroll ചെയ്യാം →
      </p>
    </div>
  );
}
