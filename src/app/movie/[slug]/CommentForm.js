// src/app/movie/[slug]/CommentForm.js
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const STORAGE_KEY = "filmi_comment_delete_tokens"; // { [commentId]: token }

function saveDeleteToken(commentId, deleteToken) {
  if (!commentId || !deleteToken) return;

  let tokenMap = {};
  try {
    tokenMap = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  } catch {
    tokenMap = {};
  }

  tokenMap[String(commentId)] = String(deleteToken);

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tokenMap));
  } catch {
    // storage blocked/full -> ignore
  }
}

export default function CommentForm({ movieId }) {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [body, setBody] = useState("");
  const [otp, setOtp] = useState("");

  const [step, setStep] = useState("write"); // write -> otp -> done
  const [loading, setLoading] = useState(false);

  const [errorMsg, setErrorMsg] = useState("");
  const [infoMsg, setInfoMsg] = useState("");

  async function requestOtp() {
    setErrorMsg("");
    setInfoMsg("");

    const cleanEmail = email.trim().toLowerCase();
    const cleanBody = body.trim();

    if (!cleanEmail || !cleanBody) {
      setErrorMsg("Emailയും commentയും നൽകണം.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/comments/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ movieId, email: cleanEmail, body: cleanBody }),
      });

      const text = await res.text();
      const json = text ? JSON.parse(text) : null;

      if (!res.ok) {
        throw new Error(json?.error || `OTP request failed (${res.status})`);
      }

      setStep("otp");
      setInfoMsg("OTP അയച്ചു. (Dev mode: OTP terminal-ൽ കാണും)");
    } catch (e) {
      setErrorMsg(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function verifyOtp() {
    setErrorMsg("");
    setInfoMsg("");

    const cleanEmail = email.trim().toLowerCase();
    const cleanBody = body.trim();
    const cleanOtp = otp.trim();

    if (!cleanOtp) {
      setErrorMsg("OTP നൽകണം.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/comments/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          movieId,
          email: cleanEmail,
          body: cleanBody,
          otp: cleanOtp,
        }),
      });

      const text = await res.text();
      const json = text ? JSON.parse(text) : null;

      if (!res.ok) {
        throw new Error(json?.error || `OTP verify failed (${res.status})`);
      }

      // ✅ Save delete token for this comment (same browser delete)
      if (json?.comment?.id && json?.deleteToken) {
        saveDeleteToken(json.comment.id, json.deleteToken);
      }

      // ✅ UI reset
      setStep("done");
      setOtp("");
      setBody("");
      // keep email (optional). If you want clear: setEmail("");

      setInfoMsg("✅ Comment posted! (ഈ browser-ൽ Delete option ലഭിക്കും.)");
      router.refresh();
    } catch (e) {
      setErrorMsg(e.message);
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setStep("write");
    setOtp("");
    setBody("");
    setErrorMsg("");
    setInfoMsg("");
  }

  return (
    <div className="mt-6 rounded-xl border p-4">
      <h3 className="font-semibold">Post a comment</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        OTP verify ചെയ്താൽ comment ഉടൻ public ആയി കാണും.
      </p>

      {errorMsg && (
        <p className="mt-3 text-sm text-red-600">{errorMsg}</p>
      )}
      {infoMsg && (
        <p className="mt-3 text-sm text-green-700">{infoMsg}</p>
      )}

      {step === "done" ? (
        <div className="mt-4">
          <button
            onClick={resetForm}
            className="rounded-lg border px-3 py-2 text-sm"
          >
            Add another comment
          </button>
        </div>
      ) : (
        <>
          <div className="mt-4 grid gap-3">
            <input
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />

            <textarea
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm min-h-[100px]"
              placeholder="Your comment"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              disabled={loading}
            />

            {step === "otp" && (
              <input
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
                placeholder="Enter 6-digit OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                disabled={loading}
              />
            )}
          </div>

          <div className="mt-4 flex gap-2">
            {step === "write" && (
              <button
                onClick={requestOtp}
                disabled={loading}
                className="rounded-lg border px-3 py-2 text-sm disabled:opacity-60"
              >
                {loading ? "Sending..." : "Send OTP"}
              </button>
            )}

            {step === "otp" && (
              <>
                <button
                  onClick={verifyOtp}
                  disabled={loading}
                  className="rounded-lg border px-3 py-2 text-sm disabled:opacity-60"
                >
                  {loading ? "Verifying..." : "Verify & Submit"}
                </button>

                <button
                  onClick={() => {
                    setStep("write");
                    setOtp("");
                    setErrorMsg("");
                    setInfoMsg("");
                  }}
                  disabled={loading}
                  className="rounded-lg border px-3 py-2 text-sm disabled:opacity-60"
                >
                  Back
                </button>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
