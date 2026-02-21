export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function POST(req) {
  try {
    const { movieId, language, file_key } = await req.json();

    if (!movieId || !language || !file_key) {
      return NextResponse.json(
        { ok: false, error: "movieId, language, file_key required" },
        { status: 400 }
      );
    }

    const supabase = supabaseAdmin();

    const { error } = await supabase.from("subtitles").insert({
      movie_id: movieId,
      language,
      downloads: 0,
      file_key, // ✅ R2 key
    });

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Server error" },
      { status: 500 }
    );
  }
}
