import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { randomUUID } from "crypto";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ORDERS_FILE = path.join(__dirname, "..", "data", "orders.json");
const REQUESTS_FILE = path.join(__dirname, "..", "data", "requests.json");
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
  try {
    await ensureDataDir();
    const data = await fs.readFile(ORDERS_FILE, "utf8");
    return JSON.parse(data);
  } catch (err) {
    if (err.code === "ENOENT") {
      return [];
    }
    throw err;
  }
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
    await fs.writeFile(ORDERS_FILE, JSON.stringify(orders, null, 2));
    return order;
  });
}

async function getAllRequests() {
  try {
    await ensureDataDir();
    return JSON.parse(await fs.readFile(REQUESTS_FILE, "utf8"));
  } catch (err) {
    if (err.code === "ENOENT") return [];
    throw err;
  }
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
    await fs.writeFile(REQUESTS_FILE, JSON.stringify(requests, null, 2));
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
  const orders = await getAllOrders();
  const orderIndex = orders.findIndex(o => o.id === orderId || o.orderNumber === orderId);
  
  if (orderIndex === -1) {
    throw new Error("Order not found");
  }
  
  const previousStatus = orders[orderIndex].status;
  orders[orderIndex].status = newStatus;
  orders[orderIndex].updatedAt = new Date().toISOString();
  
  await fs.writeFile(ORDERS_FILE, JSON.stringify(orders, null, 2));
  
  return { ...orders[orderIndex], previousStatus };
}

export { getAllOrders, generateOrderNumber, createOrder, getOrderById, updateOrderStatus, createServiceRequest, getServiceRequestById };
