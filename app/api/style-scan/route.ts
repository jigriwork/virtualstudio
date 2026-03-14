import { NextResponse } from "next/server";

import { runStyleAnalysis } from "@/ai/style-analysis";

export async function POST(request: Request) {
  const body = (await request.json()) as { imageBase64?: string };

  if (!body.imageBase64) {
    return NextResponse.json({ error: "imageBase64 is required" }, { status: 400 });
  }

  const result = await runStyleAnalysis(body.imageBase64);
  return NextResponse.json(result);
}
