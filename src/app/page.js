// src/app/page.js
import Link from "next/link";
import { supabaseServer } from "@/lib/supabase/server";
import LatestCarousel from "./components/LatestCarousel";
import PosterImage from "@/components/PosterImage";

export default async function HomePage() {
  const supabase = supabaseServer();

  const { data: movies, error } = await supabase
    .from("movies")
    .select("id, title, year, slug, poster_key, created_at")
    .order("created_at", { ascending: false })
    .limit(36);

  if (error) {
    return (
      <main className="min-h-screen p-6">
        <div className="mx-auto max-w-6xl">
          <h1 className="text-xl font-semibold">filmi-crew-official</h1>
          <p className="mt-4 text-red-600">Error: {error.message}</p>
        </div>
      </main>
    );
  }

  const latest = (movies ?? []).slice(0, 10);
  const grid = movies ?? [];

  return (
    <main className="min-h-screen px-4 py-6 sm:px-6">
      <div className="mx-auto max-w-6xl">
        {/* Top bar */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold">filmi-crew-official</h1>
            <p className="text-sm text-muted-foreground">
              Malayalam subtitle download platform
            </p>
          </div>
          <LatestCarousel items={latest} />
        </div>

        {/* Latest uploads carousel */}
        <section className="mt-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Latest uploads</h2>
            <p className="text-xs text-muted-foreground">
              Swipe / shift+mousewheel / trackpad scroll
            </p>
          </div>

          <div className="mt-3 -mx-4 px-4 sm:-mx-6 sm:px-6">
            <div className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory">
              {latest.map((m) => (
                <Link
                  key={m.id}
                  href={`/movie/${m.slug}`}
                  className="snap-start shrink-0 w-[180px] sm:w-[210px] group"
                  title={m.title}
                >
                  <div className="rounded-2xl border overflow-hidden bg-background">
                    <div className="relative aspect-[2/3] w-full bg-muted">
                      {m.poster_key ? (
                        <>
                          <PosterImage
                            posterKey={m.poster_key}
                            alt={`${m.title} poster`}
                            className="h-full w-full object-cover"
                          />
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
                        </>
                      ) : (
                        <div className="h-full w-full grid place-items-center text-xs text-muted-foreground">
                          No Poster
                        </div>
                      )}
                    </div>

                    <div className="p-3">
                      <p className="text-sm font-semibold line-clamp-1 group-hover:underline">
                        {m.title}
                      </p>
                      <p className="text-xs text-muted-foreground">{m.year ?? "—"}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* All movies grid */}
        <section className="mt-10">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">All movies</h2>
            <p className="text-xs text-muted-foreground">Showing {grid.length}</p>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {grid.map((m) => (
              <Link
                key={m.id}
                href={`/movie/${m.slug}`}
                className="group rounded-2xl border bg-background overflow-hidden hover:shadow-sm transition"
                title={m.title}
              >
                <div className="relative aspect-[2/3] w-full bg-muted">
                  {m.poster_key ? (
                    <>
                      <PosterImage
                        posterKey={m.poster_key}
                        alt={`${m.title} poster`}
                        className="h-full w-full object-cover"
                      />
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition">
                        <div className="absolute inset-0 bg-black/55" />
                        <div className="absolute bottom-3 left-3 right-3">
                          <p className="text-white text-sm font-semibold line-clamp-2">
                            {m.title}
                          </p>
                          <p className="text-white/80 text-xs">
                            {m.year ?? "—"} • View →
                          </p>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="h-full w-full grid place-items-center text-xs text-muted-foreground">
                      No Poster
                    </div>
                  )}
                </div>

                <div className="p-3">
                  <p className="text-sm font-semibold line-clamp-1 group-hover:underline">
                    {m.title}
                  </p>
                  <p className="text-xs text-muted-foreground">{m.year ?? "—"}</p>
                </div>
              </Link>
            ))}
          </div>

          {grid.length === 0 && (
            <p className="mt-8 text-muted-foreground">ഇപ്പോഴും movies ഇല്ല.</p>
          )}
        </section>
      </div>
    </main>
  );
}
