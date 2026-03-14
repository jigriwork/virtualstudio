import { NextResponse } from "next/server";

import { ADMIN_AUTH_COOKIE, getAdminSessionToken, isValidAdminPassword } from "@/lib/admin-auth";

export async function POST(request: Request) {
    const body = (await request.json().catch(() => ({}))) as { password?: string };

    if (!body.password || !isValidAdminPassword(body.password)) {
        return NextResponse.json({ error: "Invalid admin password" }, { status: 401 });
    }

    const response = NextResponse.json({ ok: true });
    response.cookies.set({
        name: ADMIN_AUTH_COOKIE,
        value: getAdminSessionToken(),
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 60 * 60 * 8,
    });

    return response;
}
