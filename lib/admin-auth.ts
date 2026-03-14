import { cookies } from "next/headers";

import { getAdminAuthSecret, getAdminPassword } from "@/lib/env";

export const ADMIN_AUTH_COOKIE = "gpbm_admin_session";

export function isValidAdminPassword(password: string) {
    return password === getAdminPassword();
}

export function getAdminSessionToken() {
    return `session:${getAdminAuthSecret()}`;
}

export function isAdminSessionToken(token?: string) {
    return token === getAdminSessionToken();
}

export async function isAdminAuthenticated() {
    const cookieStore = await cookies();
    return isAdminSessionToken(cookieStore.get(ADMIN_AUTH_COOKIE)?.value);
}
