import { NextResponse } from "next/server";
import path from "path";
import { readFile } from "fs/promises";

export async function GET(req, ctx) {
  const { filename } = await ctx.params;

  if (!filename) {
    return NextResponse.json({ ok: false, error: "Missing filename" }, { status: 400 });
  }

  const filePath = path.join(process.cwd(), "public", "uploads", filename);

  try {
    const fileBuffer = await readFile(filePath);

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": "image/jpeg",
      },
    });
  } catch {
    return NextResponse.json({ ok: false, error: "File not found" }, { status: 404 });
  }
}
