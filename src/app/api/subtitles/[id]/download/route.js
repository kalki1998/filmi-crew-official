import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function GET(req, context) {
  try {
    const { id } = context.params;

    if (!id) {
      return NextResponse.json(
        { ok: false, error: "Invalid subtitle id" },
        { status: 400 }
      );
    }

    const supabase = supabaseAdmin();

    // fetch subtitle
    const { data: sub, error } = await supabase
      .from("subtitles")
      .select("id, downloads")
      .eq("id", id)
      .single();

    if (error || !sub) {
      return NextResponse.json(
        { ok: false, error: "Subtitle not found" },
        { status: 404 }
      );
    }

    // increment downloads
    const newCount = (sub.downloads ?? 0) + 1;

    await supabase
      .from("subtitles")
      .update({ downloads: newCount })
      .eq("id", id);

    // dummy file
    const content = `Dummy subtitle file
Subtitle ID: ${id}
Downloaded at: ${new Date().toISOString()}
`;

    return new NextResponse(content, {
      status: 200,
      headers: {
        "Content-Type": "text/plain",
        "Content-Disposition": `attachment; filename="subtitle-${id}.txt"`,
        "x-download-count": String(newCount),
      },
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e.message || "Server error" },
      { status: 500 }
    );
  }
}
