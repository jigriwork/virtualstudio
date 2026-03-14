import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { ADMIN_AUTH_COOKIE, isAdminSessionToken } from "@/lib/admin-auth";

function isProtectedAdminApi(pathname: string) {
    if (!pathname.startsWith("/api/admin")) return false;
    if (pathname === "/api/admin/login" || pathname === "/api/admin/logout") return false;
    return true;
}

export function middleware(request: NextRequest) {
    const { pathname, search } = request.nextUrl;
    const token = request.cookies.get(ADMIN_AUTH_COOKIE)?.value;
    const authenticated = isAdminSessionToken(token);

    if (pathname.startsWith("/admin") && pathname !== "/admin/login" && !authenticated) {
        const loginUrl = new URL(`/admin/login?next=${encodeURIComponent(`${pathname}${search}`)}`, request.url);
        return NextResponse.redirect(loginUrl);
    }

    if (pathname === "/admin/login" && authenticated) {
        return NextResponse.redirect(new URL("/admin", request.url));
    }

    if (isProtectedAdminApi(pathname) && !authenticated) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/admin/:path*", "/api/admin/:path*"],
};
