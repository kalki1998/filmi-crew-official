// src/app/api/comments/[id]/route.js
import { NextResponse } from "next/server";
import crypto from "crypto";
import { supabaseAdmin } from "@/lib/supabase/admin";

const sha256 = (s) => crypto.createHash("sha256").update(s).digest("hex");

export async function DELETE(req, ctx) {
  try {
    // ✅ Next.js 16: params can be async
    const { id } = await ctx.params;

    // ✅ Safe JSON parsing (avoid crashes if body is empty)
    const payload = await req.json().catch(() => ({}));
    const { deleteToken } = payload;

    if (!id || !deleteToken) {
      return NextResponse.json(
        { ok: false, error: "id and deleteToken required" },
        { status: 400 }
      );
    }

    const supabase = supabaseAdmin();
    const tokenHash = sha256(String(deleteToken));

    // ✅ Read comment token hash
    const { data: row, error: readErr } = await supabase
      .from("comments")
      .select("id, delete_token_hash")
      .eq("id", id)
      .limit(1)
      .maybeSingle();

    if (readErr) {
      return NextResponse.json({ ok: false, error: readErr.message }, { status: 500 });
    }
    if (!row) {
      return NextResponse.json({ ok: false, error: "Comment not found" }, { status: 404 });
    }

    if (!row.delete_token_hash) {
      return NextResponse.json(
        { ok: false, error: "This comment cannot be deleted (missing token)." },
        { status: 403 }
      );
    }

    // ✅ Ownership check
    if (row.delete_token_hash !== tokenHash) {
      return NextResponse.json({ ok: false, error: "Not allowed" }, { status: 403 });
    }

    // ✅ Delete
    const { error: delErr } = await supabase.from("comments").delete().eq("id", id);

    if (delErr) {
      return NextResponse.json({ ok: false, error: delErr.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Server error" },
      { status: 500 }
    );
  }
}
