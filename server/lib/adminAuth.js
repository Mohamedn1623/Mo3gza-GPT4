import { createHmac, timingSafeEqual } from "crypto";

const TOKEN_TTL_SECONDS = 8 * 60 * 60;

export function adminCredentialsConfigured() {
  return Boolean(process.env.ADMIN_USERNAME && process.env.ADMIN_PASSWORD && process.env.ADMIN_SESSION_SECRET);
}

export function verifyAdminPassword(username, password) {
  if (!adminCredentialsConfigured()) return false;
  return safeEqual(username, process.env.ADMIN_USERNAME) && safeEqual(password, process.env.ADMIN_PASSWORD);
}

export function createAdminToken(username) {
  const payload = Buffer.from(JSON.stringify({ sub: username, exp: Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS })).toString("base64url");
  const signature = createHmac("sha256", process.env.ADMIN_SESSION_SECRET).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

export function requireAdmin(req, res, next) {
  if (!adminCredentialsConfigured()) return res.status(503).json({ error: "إعداد بيانات دخول لوحة الإدارة في .env أولًا." });
  const token = String(req.get("authorization") || "").replace(/^Bearer\s+/i, "");
  const [payload, signature, extra] = token.split(".");
  if (!payload || !signature || extra) return res.status(401).json({ error: "سجّل الدخول إلى لوحة الإدارة." });
  const expected = createHmac("sha256", process.env.ADMIN_SESSION_SECRET).update(payload).digest("base64url");
  if (!safeEqual(signature, expected)) return res.status(401).json({ error: "انتهت الجلسة؛ سجّل الدخول مرة أخرى." });
  try {
    const session = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (session.sub !== process.env.ADMIN_USERNAME || session.exp < Date.now() / 1000) throw new Error("expired");
    req.admin = { username: session.sub };
    return next();
  } catch {
    return res.status(401).json({ error: "انتهت الجلسة؛ سجّل الدخول مرة أخرى." });
  }
}

function safeEqual(left, right) {
  const a = Buffer.from(String(left || ""));
  const b = Buffer.from(String(right || ""));
  return a.length === b.length && timingSafeEqual(a, b);
}
