import { NextResponse } from "next/server";
import { ListObjectsV2Command } from "@aws-sdk/client-s3";
import { r2 } from "@/lib/r2";

export async function GET() {
  try {
    const data = await r2.send(
      new ListObjectsV2Command({
        Bucket: process.env.R2_BUCKET_NAME,
        MaxKeys: 5,
      })
    );

    return NextResponse.json({
      ok: true,
      keys: (data.Contents || []).map((x) => x.Key),
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e?.message || "R2 test failed" },
      { status: 500 }
    );
  }
}
