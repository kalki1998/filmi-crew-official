"use server";

import { supabaseAdmin } from "@/lib/supabase/admin";
import { r2 } from "@/lib/r2";
import { PutObjectCommand } from "@aws-sdk/client-s3";

function slugify(input = "") {
  return String(input)
    .trim()
    .toLowerCase()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function safeFileName(name = "file") {
  return String(name)
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9.\-_]/g, "")
    .slice(0, 140);
}

function getExt(name = "") {
  const parts = String(name).split(".");
  return parts.length > 1 ? parts.pop().toLowerCase() : "";
}

function subtitleContentType(ext) {
  if (ext === "srt") return "application/x-subrip";
  if (ext === "ass") return "text/plain";
  if (ext === "vtt") return "text/vtt";
  return "application/octet-stream";
}

// ✅ ONE ACTION: create movie + upload poster + upload subtitle + insert subtitle
export async function addMovieWithSubtitle(formData) {
  const supabase = supabaseAdmin();

  const titleRaw = formData.get("title");
  const yearRaw = formData.get("year");
  const poster = formData.get("poster"); // File
  const languageRaw = formData.get("language");
  const subtitle = formData.get("subtitle"); // File

  const title = String(titleRaw || "").trim();
  const language = String(languageRaw || "").trim();

  if (!title) throw new Error("Title required");
  if (!language) throw new Error("Subtitle language required");

  if (!poster || typeof poster === "string" || poster.size === 0) {
    throw new Error("Poster file required");
  }
  if (!poster.type?.startsWith("image/")) {
    throw new Error("Poster must be an image file");
  }

  if (!subtitle || typeof subtitle === "string" || subtitle.size === 0) {
    throw new Error("Subtitle file required");
  }

  const subName = safeFileName(subtitle.name || "subtitle.srt");
  const subExt = getExt(subName);
  const allowed = ["srt", "ass", "vtt"];
  if (!allowed.includes(subExt)) {
    throw new Error("Only .srt, .ass, .vtt allowed");
  }

  // 1) Upload poster to R2
  const posterBytes = await poster.arrayBuffer();
  const posterBuf = Buffer.from(posterBytes);
  const posterExt = getExt(safeFileName(poster.name || "poster.jpg")) || "jpg";
  const poster_key = `posters/${Date.now()}-${crypto.randomUUID()}.${posterExt}`;

  await r2.send(
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: poster_key,
      Body: posterBuf,
      ContentType: poster.type,
    })
  );

  // 2) Insert movie
  const year = yearRaw ? Number(yearRaw) : null;
  const slug = slugify(title);

  const { data: movie, error: movieErr } = await supabase
    .from("movies")
    .insert({
      title,
      year: Number.isFinite(year) ? year : null,
      slug,
      poster_key,
    })
    .select("id")
    .single();

  if (movieErr) throw new Error(movieErr.message);

  // 3) Upload subtitle to R2
  const subBytes = await subtitle.arrayBuffer();
  const subBuf = Buffer.from(subBytes);
  const file_key = `subtitles/${Date.now()}-${crypto.randomUUID()}-${subName}`;

  await r2.send(
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: file_key,
      Body: subBuf,
      ContentType: subtitle.type?.trim()
        ? subtitle.type
        : subtitleContentType(subExt),
    })
  );

  // 4) Insert subtitle row
  const { error: subErr } = await supabase.from("subtitles").insert({
    movie_id: movie.id,
    language,
    file_key,
    downloads: 0,
  });

  if (subErr) throw new Error(subErr.message);

  return { ok: true, movie_id: movie.id };
}