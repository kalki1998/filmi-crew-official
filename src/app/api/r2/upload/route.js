export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { r2 } from "@/lib/r2";

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

function contentTypeForExt(ext) {
  if (ext === "srt") return "application/x-subrip";
  if (ext === "ass") return "text/plain";
  if (ext === "vtt") return "text/vtt";
  return "application/octet-stream";
}

export async function POST(req) {
  try {
    const formData = await req.formData();

    const file = formData.get("file");
    const folder = (formData.get("folder") || "").toString() || "misc";

    if (!file || typeof file === "string") {
      return NextResponse.json({ ok: false, error: "No file" }, { status: 400 });
    }

    const originalName = safeFileName(file.name || "file");
    const ext = getExt(originalName);

    if (folder === "posters") {
      if (!file.type.startsWith("image/")) {
        return NextResponse.json(
          { ok: false, error: "Poster must be an image file" },
          { status: 400 }
        );
      }
    } else if (folder === "subtitles") {
      const allowed = ["srt", "ass", "vtt"];
      if (!allowed.includes(ext)) {
        return NextResponse.json(
          { ok: false, error: "Only .srt, .ass, .vtt allowed" },
          { status: 400 }
        );
      }
    } else {
      return NextResponse.json(
        { ok: false, error: "Invalid folder" },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const key = `${folder}/${Date.now()}-${crypto.randomUUID()}-${originalName}`;
    const contentType = file.type?.trim() ? file.type : contentTypeForExt(ext);

    await r2.send(
      new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: key,
        Body: buffer,
        ContentType: contentType,
      })
    );

    return NextResponse.json({ ok: true, key });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Upload failed" },
      { status: 500 }
    );
  }
}
