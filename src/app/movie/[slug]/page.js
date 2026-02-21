// src/app/movie/[slug]/page.js
import Link from "next/link";
import { notFound } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";

import DownloadButton from "./DownloadButton";
import CommentForm from "./CommentForm";
import CommentsClient from "./CommentsClient";

import PosterImage from "@/components/PosterImage";

export default async function MoviePage({ params }) {
  const { slug } = params; // ✅ no await needed
  const supabase = supabaseServer();

  // 1) Movie
  const { data: movie, error: movieError } = await supabase
    .from("movies")
    .select("id, title, year, slug, poster_key, created_at")
    .eq("slug", slug)
    .single();

  if (movieError || !movie) return notFound();

  // 2) Subtitles
  const { data: subtitles, error: subError } = await supabase
    .from("subtitles")
    .select("id, language, file_key, downloads, created_at")
    .eq("movie_id", movie.id)
    .order("created_at", { ascending: false });

  // 3) Comments
  const { data: comments, error: comError } = await supabase
    .from("comments")
    .select("id, email, body, created_at")
    .eq("movie_id", movie.id)
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <main className="min-h-screen p-6">
      <div className="mx-auto max-w-4xl">
        <Link href="/" className="text-sm text-muted-foreground hover:underline">
          ← Home
        </Link>

        {/* Header */}
        <header className="mt-4 rounded-xl border p-4">
          <h1 className="text-2xl font-bold">{movie.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {movie.year ?? "—"} • {movie.slug}
          </p>

          {/* Poster (R2 signed url via PosterImage) */}
          <div className="mt-4 overflow-hidden rounded-xl border bg-muted">
            <div className="relative aspect-[16/9] w-full">
              {movie.poster_key ? (
                <>
                  <PosterImage
                    posterKey={movie.poster_key}
                    alt={`${movie.title} poster`}
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
                  <div className="absolute bottom-3 left-3 right-3">
                    <p className="text-white font-semibold drop-shadow">
                      {movie.title}
                    </p>
                    <p className="text-white/80 text-xs drop-shadow">
                      {movie.year ?? ""}
                    </p>
                  </div>
                </>
              ) : (
                <div className="h-full w-full grid place-items-center">
                  <div className="text-center">
                    <p className="text-sm font-medium text-muted-foreground">
                      No poster yet
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Admin panel-ൽ നിന്ന് poster upload ചെയ്യൂ
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Subtitles */}
        <section className="mt-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Subtitles</h2>
            <span className="text-xs text-muted-foreground">
              {subtitles?.length ?? 0} file(s)
            </span>
          </div>

          {subError && (
            <p className="mt-3 text-red-600 text-sm">
              Subtitles load ചെയ്യാൻ പറ്റുന്നില്ല: {subError.message}
            </p>
          )}

          {!subError && (subtitles?.length ?? 0) === 0 && (
            <p className="mt-3 text-sm text-muted-foreground">
              ഇതിന് ഇപ്പോൾ subtitles ഇല്ല.
            </p>
          )}

          <div className="mt-4 grid gap-3">
            {(subtitles ?? []).map((s) => (
              <div
                key={s.id}
                className="rounded-xl border p-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="font-medium truncate">{s.language ?? "Language"}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {s.file_key ?? "—"}
                  </p>
                </div>

                <DownloadButton
                  subtitleId={s.id}
                  initialDownloads={s.downloads ?? 0}
                />
              </div>
            ))}
          </div>
        </section>

        {/* Comments */}
        <section className="mt-10">
          <h2 className="text-lg font-semibold">Comments</h2>

          {comError && (
            <p className="mt-3 text-red-600 text-sm">
              Comments load ചെയ്യാൻ പറ്റുന്നില്ല: {comError.message}
            </p>
          )}

          {!comError && <CommentsClient initialComments={comments ?? []} />}

          <CommentForm movieId={movie.id} />
        </section>
      </div>
    </main>
  );
}
