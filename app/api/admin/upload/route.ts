import { NextResponse } from "next/server";

import { createProductFromFormData } from "@/lib/product-admin-service";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const formData = await request.formData();
  const result = await createProductFromFormData(formData);

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ product: result.product }, { status: 201 });
}
