export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { r2 } from "@/lib/r2";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export async function POST(req) {
  try {
    const { subtitleId } = await req.json();

    if (!subtitleId) {
      return NextResponse.json(
        { ok: false, error: "subtitleId required" },
        { status: 400 }
      );
    }

    const supabase = supabaseAdmin();

    // 1) Read subtitle row
    const { data: sub, error: readErr } = await supabase
      .from("subtitles")
      .select("id, file_key, downloads")
      .eq("id", subtitleId)
      .single();

    if (readErr || !sub) {
      return NextResponse.json(
        { ok: false, error: "Subtitle not found" },
        { status: 404 }
      );
    }

    if (!sub.file_key) {
      return NextResponse.json(
        { ok: false, error: "Subtitle file_key missing" },
        { status: 400 }
      );
    }

    // 2) Increment count
    const nextDownloads = (sub.downloads ?? 0) + 1;

    const { error: upErr } = await supabase
      .from("subtitles")
      .update({ downloads: nextDownloads })
      .eq("id", subtitleId);

    if (upErr) {
      return NextResponse.json(
        { ok: false, error: upErr.message },
        { status: 500 }
      );
    }

    // 3) Signed URL (10 minutes)
    const cmd = new GetObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: sub.file_key,
    });

    const url = await getSignedUrl(r2, cmd, { expiresIn: 60 * 10 });

    return NextResponse.json({ ok: true, url, downloads: nextDownloads });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Download failed" },
      { status: 500 }
    );
  }
}