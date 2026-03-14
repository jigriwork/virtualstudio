const fallbackBaseUrl = "http://localhost:3000";

export function getAppBaseUrl() {
    return (process.env.APP_BASE_URL?.trim() || fallbackBaseUrl).replace(/\/$/, "");
}

export function getAdminPassword() {
    return process.env.ADMIN_PASSWORD?.trim() || "admin123";
}

export function getAdminAuthSecret() {
    return process.env.ADMIN_AUTH_SECRET?.trim() || "change-this-admin-auth-secret";
}
