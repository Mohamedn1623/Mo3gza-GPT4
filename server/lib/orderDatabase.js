import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { randomUUID } from "crypto";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ORDERS_FILE = path.join(__dirname, "..", "data", "orders.json");
const REQUESTS_FILE = path.join(__dirname, "..", "data", "requests.json");
const CONTACTS_FILE = path.join(__dirname, "..", "data", "contacts.json");
const DATA_DIR = path.join(__dirname, "..", "data");
let writeQueue = Promise.resolve();

function serializeWrite(operation) {
  const result = writeQueue.then(operation, operation);
  writeQueue = result.then(() => undefined, () => undefined);
  return result;
}

function cairoDateCode(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Cairo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${values.year}${values.month}${values.day}`;
}

// Ensure data directory exists
async function ensureDataDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch (err) {
    console.error("Failed to create data directory:", err);
  }
}

// Get all orders
async function getAllOrders() {
  return readCollection("order", ORDERS_FILE);
}

// Get next order number (ORD-20260902-000001)
async function generateOrderNumber() {
  const orders = await getAllOrders();
  const today = cairoDateCode();
  const prefix = `ORD-${today}-`;
  const todayOrders = orders.filter(o => o.orderNumber?.startsWith(prefix));
  const sequence = todayOrders.reduce((max, order) => Math.max(max, Number(order.orderNumber.slice(prefix.length)) || 0), 0) + 1;
  return `ORD-${today}-${String(sequence).padStart(6, "0")}`;
}

// Create order
async function createOrder(data) {
  return serializeWrite(async () => {
    await ensureDataDir();
    const orders = await getAllOrders();
    const orderNumber = await generateOrderNumber();
    const now = new Date().toISOString();
    const order = {
      id: `order_${randomUUID()}`,
      orderNumber,
      customerName: data.customerName || data.name || "Guest",
      customerEmail: data.customerEmail || data.email || "",
      customerPhone: data.customerPhone || data.phone || "",
      items: data.items || [],
      total: data.total || "0",
      paymentMethod: data.payment_method || data.paymentMethod || "cash",
      paymentReceipt: data.payment_receipt || data.paymentReceipt || null,
      deliveryType: data.deliveryType || "shipping",
      status: "awaiting_payment_review",
      createdAt: now,
      updatedAt: now,
    };
    orders.push(order);
    await writeCollection("order", ORDERS_FILE, orders);
    return order;
  });
}

async function getAllRequests() {
  return readCollection("request", REQUESTS_FILE);
}

async function getAllServiceRequests() { return getAllRequests(); }

async function getAllContactMessages() {
  return readCollection("contact", CONTACTS_FILE);
}

async function createContactRecord(fields) {
  return serializeWrite(async () => {
    const contacts = await getAllContactMessages();
    const contact = { id: `MSG-${randomUUID().slice(0, 8).toUpperCase()}`, fields, status: "new", replies: [], createdAt: new Date().toISOString() };
    contacts.push(contact);
    await writeCollection("contact", CONTACTS_FILE, contacts);
    return contact;
  });
}

async function createServiceRequest(fields) {
  return serializeWrite(async () => {
    await ensureDataDir();
    const requests = await getAllRequests();
    const now = new Date();
    const date = cairoDateCode(now);
    const prefix = `LC-${date}-`;
    const count = requests.filter((request) => request.id.startsWith(prefix)).reduce((max, request) => Math.max(max, Number(request.id.slice(prefix.length)) || 0), 0) + 1;
    const id = `${prefix}${String(count).padStart(6, "0")}`;
    const request = { id, fields, status: "pending", createdAt: now.toISOString() };
    requests.push(request);
    await writeCollection("request", REQUESTS_FILE, requests);
    return request;
  });
}

async function getServiceRequestById(id) {
  const requests = await getAllRequests();
  return requests.find((request) => request.id === id);
}

// Get order by ID
async function getOrderById(id) {
  const orders = await getAllOrders();
  return orders.find(o => o.id === id || o.orderNumber === id);
}

// Update order status
async function updateOrderStatus(orderId, newStatus) {
  return serializeWrite(async () => {
    const orders = await getAllOrders();
    const orderIndex = orders.findIndex(o => o.id === orderId || o.orderNumber === orderId);
    if (orderIndex === -1) throw new Error("Order not found");
    const previousStatus = orders[orderIndex].status;
    orders[orderIndex].status = newStatus;
    orders[orderIndex].updatedAt = new Date().toISOString();
    await writeCollection("order", ORDERS_FILE, orders);
    return { ...orders[orderIndex], previousStatus };
  });
}

async function updateServiceRequestStatus(requestId, newStatus) {
  return serializeWrite(async () => {
    const requests = await getAllRequests();
    const index = requests.findIndex((request) => request.id === requestId);
    if (index === -1) throw new Error("Request not found");
    const previousStatus = requests[index].status;
    requests[index] = { ...requests[index], status: newStatus, updatedAt: new Date().toISOString() };
    await writeCollection("request", REQUESTS_FILE, requests);
    return { ...requests[index], previousStatus };
  });
}

async function addAdminReply(kind, id, reply) {
  return serializeWrite(async () => {
    const collection = kind === "order" ? "order" : kind === "request" ? "request" : "contact";
    const file = kind === "order" ? ORDERS_FILE : kind === "request" ? REQUESTS_FILE : CONTACTS_FILE;
    const records = await readCollection(collection, file);
    const index = records.findIndex((record) => record.id === id || record.orderNumber === id);
    if (index === -1) throw new Error("Record not found");
    records[index].replies ||= [];
    records[index].replies.push({ ...reply, createdAt: new Date().toISOString() });
    await writeCollection(collection, file, records);
    return records[index];
  });
}

async function readCollection(kind, file) {
  const storageMode = getStorageMode();
  if (storageMode === "supabase") {
    const base = process.env.SUPABASE_URL.replace(/\/$/, "");
    const response = await fetch(`${base}/rest/v1/lapgpt_records?select=data&kind=eq.${kind}&order=created_at.asc`, { headers: supabaseHeaders() });
    if (!response.ok) throw new Error(`Supabase read failed (${response.status}).`);
    const rows = await response.json();
    if (rows.length) return rows.map((row) => row.data);
    const legacy = await readLocalCollection(file);
    if (legacy.length) await writeCollection(kind, file, legacy);
    return legacy;
  }
  if (storageMode === "unavailable") {
    throw new Error("التخزين غير مهيأ: أضف SUPABASE_URL وSUPABASE_SECRET_KEY إلى متغيرات بيئة Vercel.");
  }
  return readLocalCollection(file);
}

async function readLocalCollection(file) {
  try {
    await ensureDataDir();
    return JSON.parse(await fs.readFile(file, "utf8"));
  } catch (err) {
    if (err.code === "ENOENT") return [];
    throw err;
  }
}

async function writeCollection(kind, file, records) {
  const storageMode = getStorageMode();
  if (storageMode === "supabase") {
    if (!records.length) return;
    const rows = records.map((data) => ({ id: data.id, kind, created_at: data.createdAt || new Date().toISOString(), data }));
    const response = await fetch(`${process.env.SUPABASE_URL.replace(/\/$/, "")}/rest/v1/lapgpt_records?on_conflict=id`, {
      method: "POST",
      headers: { ...supabaseHeaders(), "Content-Type": "application/json", Prefer: "resolution=merge-duplicates,return=minimal" },
      body: JSON.stringify(rows),
    });
    if (!response.ok) throw new Error(`Supabase write failed (${response.status}).`);
    return;
  }
  if (storageMode === "unavailable") {
    throw new Error("التخزين غير مهيأ: أضف SUPABASE_URL وSUPABASE_SECRET_KEY إلى متغيرات بيئة Vercel.");
  }
  await ensureDataDir();
  await fs.writeFile(file, JSON.stringify(records, null, 2));
}

function supabaseHeaders() {
  const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  return { apikey: key, Authorization: `Bearer ${key}` };
}

function hasSupabaseConfig() {
  return Boolean(process.env.SUPABASE_URL && (process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY));
}

function getStorageMode() {
  if (hasSupabaseConfig()) return "supabase";
  if (process.env.VERCEL === "1" || process.env.NODE_ENV === "production") return "unavailable";
  return "local";
}

async function checkStorageHealth() {
  const mode = getStorageMode();
  if (mode !== "supabase") return { ok: mode === "local", storage: mode };
  const base = process.env.SUPABASE_URL.replace(/\/$/, "");
  const response = await fetch(`${base}/rest/v1/lapgpt_records?select=id&limit=1`, { headers: supabaseHeaders() });
  return { ok: response.ok, storage: response.ok ? "supabase" : "unavailable", status: response.status };
}

export { getAllOrders, generateOrderNumber, createOrder, getOrderById, updateOrderStatus, createServiceRequest, getServiceRequestById, getAllServiceRequests, getAllContactMessages, createContactRecord, updateServiceRequestStatus, addAdminReply, getStorageMode, checkStorageHealth };
