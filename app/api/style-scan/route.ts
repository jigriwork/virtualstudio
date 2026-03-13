import { NextResponse } from "next/server";

import { runStyleAnalysis } from "@/ai/style-analysis";

export async function POST(request: Request) {
  const body = (await request.json()) as { imageBase64?: string };
  const result = await runStyleAnalysis(body.imageBase64);
  return NextResponse.json(result);
}
