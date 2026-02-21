import { NextResponse } from "next/server";
import crypto from "crypto";
import { supabaseAdmin } from "@/lib/supabase/admin";

// DEV: prints OTP in terminal until email service added
const DEV_LOG_OTP = true;

const sha256 = (input) =>
  crypto.createHash("sha256").update(input).digest("hex");

export async function POST(req) {
  try {
    const payload = await req.json().catch(() => ({}));
    const { movieId, email, body } = payload;

    // ✅ Required fields
    if (!movieId || !email || !body) {
      return NextResponse.json(
        { ok: false, error: "movieId, email, body required" },
        { status: 400 }
      );
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const cleanBody = String(body).trim();

    // ✅ Basic validation
    if (!cleanEmail.includes("@")) {
      return NextResponse.json({ ok: false, error: "Invalid email" }, { status: 400 });
    }
    if (cleanBody.length < 2) {
      return NextResponse.json({ ok: false, error: "Comment too short" }, { status: 400 });
    }
    if (cleanBody.length > 2000) {
      return NextResponse.json({ ok: false, error: "Comment too long" }, { status: 400 });
    }

    const supabase = supabaseAdmin();

    // ✅ Simple rate limit (60s per email + movie)
    const { data: recent, error: rateErr } = await supabase
      .from("otp_tokens")
      .select("created_at")
      .eq("email", cleanEmail)
      .eq("movie_id", movieId)
      .order("created_at", { ascending: false })
      .limit(1);

    if (rateErr) {
      return NextResponse.json({ ok: false, error: rateErr.message }, { status: 500 });
    }

    if (recent?.[0]?.created_at) {
      const lastTime = new Date(recent[0].created_at).getTime();
      if (Date.now() - lastTime < 60_000) {
        return NextResponse.json(
          { ok: false, error: "Please wait 60 seconds and try again." },
          { status: 429 }
        );
      }
    }

    // ✅ Generate OTP
    const otp = String(crypto.randomInt(100000, 1000000));
    const otpHash = sha256(otp);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes

    // ✅ Insert token
    const { error: insertErr } = await supabase.from("otp_tokens").insert({
      email: cleanEmail,
      movie_id: movieId,
      otp_hash: otpHash,
      expires_at: expiresAt,
      used: false,
    });

    if (insertErr) {
      return NextResponse.json({ ok: false, error: insertErr.message }, { status: 500 });
    }

    // DEV: log OTP to terminal
    if (DEV_LOG_OTP) {
      console.log("[DEV OTP]", {
        email: cleanEmail,
        movieId,
        otp,
      });
    }

    // TODO: integrate email provider (Resend/SMTP)
    return NextResponse.json({
      ok: true,
      message: "OTP sent",
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Server error" },
      { status: 500 }
    );
  }
}
