// src/app/api/comments/verify-otp/route.js
import { NextResponse } from "next/server";
import crypto from "crypto";
import { supabaseAdmin } from "@/lib/supabase/admin";

const sha256 = (s) => crypto.createHash("sha256").update(s).digest("hex");

export async function POST(req) {
  try {
    const payload = await req.json().catch(() => ({}));
    const { movieId, email, body, otp } = payload;

    // ✅ Basic validation
    if (!movieId || !email || !body || !otp) {
      return NextResponse.json(
        { ok: false, error: "movieId, email, body, otp required" },
        { status: 400 }
      );
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const cleanBody = String(body).trim();
    const cleanOtp = String(otp).trim();

    if (!cleanEmail.includes("@")) {
      return NextResponse.json({ ok: false, error: "Invalid email" }, { status: 400 });
    }
    if (cleanBody.length < 2) {
      return NextResponse.json({ ok: false, error: "Comment too short" }, { status: 400 });
    }
    if (cleanBody.length > 2000) {
      return NextResponse.json({ ok: false, error: "Comment too long" }, { status: 400 });
    }
    if (!/^\d{6}$/.test(cleanOtp)) {
      return NextResponse.json({ ok: false, error: "OTP must be 6 digits" }, { status: 400 });
    }

    const supabase = supabaseAdmin();

    // ✅ Get latest OTP token
    const { data: token, error: tokErr } = await supabase
      .from("otp_tokens")
      .select("id, otp_hash, expires_at, used")
      .eq("email", cleanEmail)
      .eq("movie_id", movieId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (tokErr) {
      return NextResponse.json({ ok: false, error: tokErr.message }, { status: 500 });
    }
    if (!token) {
      return NextResponse.json(
        { ok: false, error: "OTP not found. Request again." },
        { status: 400 }
      );
    }
    if (token.used) {
      return NextResponse.json(
        { ok: false, error: "OTP already used. Request again." },
        { status: 400 }
      );
    }
    if (token.expires_at && new Date(token.expires_at).getTime() < Date.now()) {
      return NextResponse.json(
        { ok: false, error: "OTP expired. Request again." },
        { status: 400 }
      );
    }

    // ✅ Verify OTP
    if (sha256(cleanOtp) !== token.otp_hash) {
      return NextResponse.json({ ok: false, error: "Wrong OTP" }, { status: 400 });
    }

    // ✅ Generate delete token (same browser can delete later)
    const deleteToken = crypto.randomBytes(24).toString("hex");
    const deleteTokenHash = sha256(deleteToken);

    // ✅ Insert comment (visible immediately)
    const { data: inserted, error: cErr } = await supabase
      .from("comments")
      .insert({
        movie_id: movieId,
        email: cleanEmail,
        body: cleanBody,
        delete_token_hash: deleteTokenHash,
      })
      .select("id, movie_id, email, body, created_at")
      .limit(1)
      .maybeSingle();

    if (cErr) {
      return NextResponse.json({ ok: false, error: cErr.message }, { status: 500 });
    }

    // ✅ Mark OTP used (important)
    const { error: usedErr } = await supabase
      .from("otp_tokens")
      .update({ used: true })
      .eq("id", token.id);

    if (usedErr) {
      // Comment inserted already, so still return ok, but warn (rare)
      return NextResponse.json({
        ok: true,
        comment: inserted,
        deleteToken,
        warning: "Comment posted, but OTP token could not be marked used.",
      });
    }

    return NextResponse.json({
      ok: true,
      comment: inserted,
      deleteToken, // client stores in localStorage
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Server error" },
      { status: 500 }
    );
  }
}
