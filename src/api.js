const API_BASE = import.meta.env.VITE_API_URL || "";

async function requestJson(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      Accept: "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  const contentType = res.headers.get("content-type") || "";
  const data = contentType.includes("application/json") ? await res.json().catch(() => ({})) : await res.text().catch(() => "");

  if (!res.ok) {
    throw new Error(data?.error || data || "request_failed");
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
