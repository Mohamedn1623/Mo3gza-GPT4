const API_BASE = (import.meta.env.VITE_API_URL || "").replace(/\/+$/, "");

function apiUrl(path) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  // VITE_API_URL has historically been documented as /api for Vercel, while
  // callers already provide /api/... paths. Collapse that duplicate prefix.
  if (API_BASE.endsWith("/api") && /^\/api(?:\/|$)/.test(normalizedPath)) {
    return `${API_BASE.slice(0, -4)}${normalizedPath}`;
  }
  return `${API_BASE}${normalizedPath}`;
}

async function requestJson(path, options = {}) {
  const res = await fetch(apiUrl(path), {
    headers: {
      Accept: "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  const contentType = res.headers.get("content-type") || "";
  const data = contentType.includes("application/json") ? await res.json().catch(() => ({})) : await res.text().catch(() => "");

  if (!res.ok) {
    const responseMessage = typeof data === "string" ? data.trim() : data?.error;
    // Vercel's NOT_FOUND and function failures can return an empty body or an
    // HTML page. Avoid showing that markup (or the unhelpful request_failed).
    const looksLikeHtml = /^<!doctype html|^<html/i.test(responseMessage || "");
    const message = responseMessage && !looksLikeHtml
      ? responseMessage
      : res.status === 404
        ? "مسار الخدمة غير موجود على Vercel. تأكد من نشر آخر نسخة التي تحتوي على دوال API."
        : `تعذر الاتصال بالخدمة (HTTP ${res.status}). راجع سجلات دوال API وإعدادات Vercel.`;
    throw new Error(message);
  }

  return data;
}

export async function createRequest(payload) {
  return requestJson("/api/requests", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function sendContact(payload) {
  return requestJson("/api/contact", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function sendMessage(payload) {
  return requestJson("/api/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function sendStatus(payload) {
  return requestJson("/api/status", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function createOrder(payload) {
  return requestJson("/api/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function getOrder(orderId, phone) {
  return requestJson(`/api/orders/${encodeURIComponent(orderId)}?phone=${encodeURIComponent(phone)}`, {
    method: "GET",
  });
}

export async function getServiceRequest(requestId, phone) {
  return requestJson(`/api/requests/${encodeURIComponent(requestId)}?phone=${encodeURIComponent(phone)}`, {
    method: "GET",
  });
}

export async function adminLogin(payload) {
  return requestJson("/api/admin/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

function adminRequest(path, body) {
  const token = sessionStorage.getItem("lapgpt_admin_token");
  return requestJson(`/api/admin${path}`, {
    method: body ? "POST" : "GET",
    headers: {
      Authorization: `Bearer ${token || ""}`,
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
}

export function getAdminDashboard() { return adminRequest("/dashboard"); }
export function updateAdminStatus(payload) { return adminRequest("/status", payload); }
export function replyToCustomer(payload) { return adminRequest("/reply", payload); }
export function sendAdminTestEmail() { return adminRequest("/test-email", {}); }
